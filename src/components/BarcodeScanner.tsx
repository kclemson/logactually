import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  BrowserMultiFormatReader, 
  DecodeHintType, 
  BarcodeFormat,
  HTMLCanvasElementLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';
import { Camera, ScanLine, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

// Barcode formats to support (UPC/EAN for products, CODE_128/39 for general, RSS for produce)
const SUPPORTED_FORMATS = [
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.RSS_14,
  BarcodeFormat.RSS_EXPANDED,
];

// Pre-configured decoder hints (created once, reused)
const DECODER_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
  [DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS],
]);

interface DebugInfo {
  status: 'starting' | 'active' | 'error' | 'captured' | 'success';
  videoWidth: number;
  videoHeight: number;
  decodeAttempts: number;
  lastError: string | null;
  captureResult: string | null;
  rotationApplied: number;
}

interface SuccessState {
  code: string;
  format: string;
}

interface TrackDimensions {
  width: number;
  height: number;
}

// Detect if we need to rotate: track is landscape but video element is portrait (or vice versa)
function detectRotationNeeded(track: TrackDimensions, video: HTMLVideoElement): number {
  const trackIsLandscape = track.width > track.height;
  const videoIsLandscape = video.videoWidth > video.videoHeight;
  
  // If orientations don't match, we need 90° rotation
  if (trackIsLandscape !== videoIsLandscape) {
    return 90;
  }
  return 0;
}

// Collect environment info once per session
function getEnvironmentInfo() {
  const vv = window.visualViewport;
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    devicePixelRatio: window.devicePixelRatio,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    documentClientWidth: document.documentElement.clientWidth,
    documentClientHeight: document.documentElement.clientHeight,
    visualViewport: vv ? {
      width: vv.width,
      height: vv.height,
      scale: vv.scale,
      offsetLeft: vv.offsetLeft,
      offsetTop: vv.offsetTop,
    } : null,
    screenWidth: screen.width,
    screenHeight: screen.height,
    orientation: screen.orientation ? {
      type: screen.orientation.type,
      angle: screen.orientation.angle,
    } : null,
  };
}

// Collect layout measurements for dialog and video
function getLayoutInfo(dialogEl: HTMLElement | null, videoEl: HTMLVideoElement | null) {
  const vv = window.visualViewport;
  const viewportWidth = vv?.width ?? window.innerWidth;
  
  const dialogRect = dialogEl?.getBoundingClientRect();
  const videoRect = videoEl?.getBoundingClientRect();
  const videoStyle = videoEl ? getComputedStyle(videoEl) : null;
  
  return {
    viewportWidth,
    dialog: dialogRect ? {
      left: Math.round(dialogRect.left),
      right: Math.round(dialogRect.right),
      width: Math.round(dialogRect.width),
      top: Math.round(dialogRect.top),
      bottom: Math.round(dialogRect.bottom),
      height: Math.round(dialogRect.height),
      overflowLeft: dialogRect.left < 0,
      overflowRight: dialogRect.right > viewportWidth,
    } : null,
    video: videoRect ? {
      left: Math.round(videoRect.left),
      right: Math.round(videoRect.right),
      width: Math.round(videoRect.width),
      height: Math.round(videoRect.height),
      videoWidth: videoEl?.videoWidth ?? 0,
      videoHeight: videoEl?.videoHeight ?? 0,
      clientWidth: videoEl?.clientWidth ?? 0,
      clientHeight: videoEl?.clientHeight ?? 0,
      objectFit: videoStyle?.objectFit ?? null,
      transform: videoStyle?.transform ?? null,
    } : null,
  };
}

// Compute simple image quality metrics from canvas
function computeFrameStats(canvas: HTMLCanvasElement): Record<string, number> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return {};
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let totalLuminance = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += luminance;
    pixelCount++;
  }
  
  const meanLuminance = totalLuminance / pixelCount;
  
  let variance = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    variance += (luminance - meanLuminance) ** 2;
  }
  const stdDev = Math.sqrt(variance / pixelCount);
  
  let edgeSum = 0;
  let edgeCount = 0;
  const width = canvas.width;
  for (let i = 4; i < data.length - 4; i += 16) {
    if ((i / 4) % width === 0) continue;
    const left = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
    const right = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
    edgeSum += Math.abs(right - left);
    edgeCount++;
  }
  const edgeDensity = edgeCount > 0 ? edgeSum / edgeCount : 0;
  
  return {
    meanLuminance: Math.round(meanLuminance * 10) / 10,
    contrastStdDev: Math.round(stdDev * 10) / 10,
    edgeDensity: Math.round(edgeDensity * 10) / 10,
    sampleWidth: canvas.width,
    sampleHeight: canvas.height,
  };
}

// Send debug events to backend for logging
async function logDebugEvents(
  sessionId: string,
  events: Array<{ event: string; phase?: string; data?: Record<string, unknown> }>
) {
  try {
    await supabase.functions.invoke('log-scanner-debug', {
      body: { 
        events: events.map(e => ({ 
          ...e, 
          sessionId,
          timestamp: new Date().toISOString() 
        })) 
      }
    });
  } catch (err) {
    console.error('Debug logging failed:', err);
  }
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    status: 'starting',
    videoWidth: 0,
    videoHeight: 0,
    decodeAttempts: 0,
    lastError: null,
    captureResult: null,
    rotationApplied: 0,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string>('');
  const decodeAttemptsRef = useRef(0);
  const decodeStartTimeRef = useRef<number>(0);
  const errorCountsRef = useRef<Map<string, number>>(new Map());
  const trackDimensionsRef = useRef<TrackDimensions>({ width: 0, height: 0 });
  const rotationNeededRef = useRef<number>(0);
  const decodeLoopRef = useRef<number | null>(null);

  // Rotation-aware decode from video element
  const decodeWithRotation = useCallback((
    video: HTMLVideoElement,
    reader: BrowserMultiFormatReader,
    rotation: number
  ): { text: string; format: string } | null => {
    // Ensure canvas exists
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    
    if (vw === 0 || vh === 0) return null;

    // Set canvas size based on rotation
    if (rotation === 90 || rotation === 270) {
      canvas.width = vh;
      canvas.height = vw;
    } else {
      canvas.width = vw;
      canvas.height = vh;
    }

    // Draw with rotation
    ctx.save();
    if (rotation === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
    } else if (rotation === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
    } else if (rotation === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate(-Math.PI / 2);
    }
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    // Decode from canvas
    try {
      const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      const result = reader.decodeBitmap(binaryBitmap);
      return {
        text: result.getText(),
        format: BarcodeFormat[result.getBarcodeFormat()] || 'unknown',
      };
    } catch {
      return null;
    }
  }, []);

  // Manual capture function
  const handleManualCapture = useCallback(() => {
    if (!readerRef.current || !videoRef.current) {
      setDebugInfo(prev => ({ ...prev, captureResult: 'No reader/video available' }));
      return;
    }

    const video = videoRef.current;
    const reader = readerRef.current;
    const sessionId = sessionIdRef.current;
    const rotation = rotationNeededRef.current;
    
    // Capture frame stats
    let frameStats: Record<string, unknown> = {};
    try {
      const statsCanvas = document.createElement('canvas');
      const targetWidth = 320;
      const scale = targetWidth / video.videoWidth;
      statsCanvas.width = targetWidth;
      statsCanvas.height = Math.round(video.videoHeight * scale);
      const ctx = statsCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, statsCanvas.width, statsCanvas.height);
        frameStats = computeFrameStats(statsCanvas);
      }
    } catch (e) {
      frameStats = { error: 'Failed to compute frame stats' };
    }
    
    const layout = getLayoutInfo(dialogRef.current, video);

    setDebugInfo(prev => ({ ...prev, captureResult: 'Capturing...', status: 'captured' }));

    // Try multiple rotations if needed
    const rotationsToTry = rotation !== 0 ? [rotation, 0, 180, 270] : [0, 90, 180, 270];
    let result: { text: string; format: string } | null = null;
    let successRotation = 0;

    for (const rot of rotationsToTry) {
      result = decodeWithRotation(video, reader, rot);
      if (result) {
        successRotation = rot;
        break;
      }
    }

    if (result) {
      logDebugEvents(sessionId, [{ 
        event: 'manual_capture_success',
        phase: 'capture',
        data: { 
          code: result.text,
          format: result.format,
          rotationUsed: successRotation,
          frameStats,
          layout,
          attempts: decodeAttemptsRef.current,
        } 
      }]);
      
      // Stop decode loop but keep stream for success overlay
      if (decodeLoopRef.current) {
        cancelAnimationFrame(decodeLoopRef.current);
        decodeLoopRef.current = null;
      }
      
      // Show success state
      setSuccessState({ code: result.text, format: result.format });
      setDebugInfo(prev => ({ ...prev, status: 'success' }));
      
      // Delay before calling onScan to show success feedback
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        readerRef.current = null;
        streamRef.current = null;
        onScan(result.text);
      }, 1200);
    } else {
      setDebugInfo(prev => ({ 
        ...prev, 
        captureResult: 'No barcode found',
        status: 'active'
      }));
      
      logDebugEvents(sessionId, [{ 
        event: 'manual_capture_failed',
        phase: 'capture',
        data: { 
          rotationsTried: rotationsToTry,
          frameStats,
          layout,
          attempts: decodeAttemptsRef.current,
        } 
      }]);
      
      setTimeout(() => {
        setDebugInfo(prev => ({ ...prev, captureResult: null }));
      }, 2000);
    }
  }, [onScan, decodeWithRotation]);

  useEffect(() => {
    if (!open) return;

    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    
    setError(null);
    setIsStarting(true);
    decodeAttemptsRef.current = 0;
    decodeStartTimeRef.current = Date.now();
    errorCountsRef.current = new Map();
    rotationNeededRef.current = 0;
    setSuccessState(null);
    setStreamReady(false);
    setDebugInfo({
      status: 'starting',
      videoWidth: 0,
      videoHeight: 0,
      decodeAttempts: 0,
      lastError: null,
      captureResult: null,
      rotationApplied: 0,
    });

    let mounted = true;

    const startScanner = async () => {
      try {
        const environment = getEnvironmentInfo();
        logDebugEvents(sessionId, [{ 
          event: 'scanner_session_start',
          phase: 'opening',
          data: { environment }
        }]);

        // Pre-create ZXing decoder (doesn't depend on video stream)
        const reader = new BrowserMultiFormatReader(DECODER_HINTS);
        readerRef.current = reader;

        // Wait for video element to be ready (poll with timeout)
        const maxWaitMs = 2000;
        const pollIntervalMs = 50;
        let waited = 0;
        
        while (!videoRef.current && waited < maxWaitMs) {
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
          waited += pollIntervalMs;
        }
        
        if (!mounted) return;
        
        if (!videoRef.current) {
          logDebugEvents(sessionId, [{
            event: 'video_ref_timeout',
            phase: 'error',
            data: { 
              reason: 'Video element not attached to DOM after waiting',
              waitedMs: waited 
            }
          }]);
          setError('Camera initialization failed. Please try again.');
          setIsStarting(false);
          return;
        }

        const requestedConstraints = {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: requestedConstraints
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        const videoTrack = stream.getVideoTracks()[0];
        const trackSettings = videoTrack?.getSettings?.() ?? {};
        const trackCapabilities = videoTrack?.getCapabilities?.() ?? {};
        
        // Store track dimensions for rotation detection
        trackDimensionsRef.current = {
          width: trackSettings.width || 0,
          height: trackSettings.height || 0,
        };
        
        logDebugEvents(sessionId, [{
          event: 'stream_acquired',
          phase: 'stream',
          data: {
            requestedConstraints,
            trackSettings: {
              width: trackSettings.width,
              height: trackSettings.height,
              frameRate: trackSettings.frameRate,
              facingMode: trackSettings.facingMode,
              aspectRatio: trackSettings.aspectRatio,
            },
            trackCapabilities: {
              width: trackCapabilities.width,
              height: trackCapabilities.height,
              facingMode: trackCapabilities.facingMode,
              focusMode: (trackCapabilities as any).focusMode,
              zoom: (trackCapabilities as any).zoom,
              torch: (trackCapabilities as any).torch,
            },
            trackCount: stream.getVideoTracks().length,
            trackState: videoTrack?.readyState,
          }
        }]);

        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video failed to load'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            if (video.videoWidth > 0) {
              resolve();
            } else {
              reject(new Error('Video metadata timeout'));
            }
          }, 5000);
        });

        await videoRef.current.play();

        if (!mounted) return;

        // Show UI immediately now that video is playing
        setIsStarting(false);

        const video = videoRef.current;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Detect rotation mismatch
        const rotation = detectRotationNeeded(trackDimensionsRef.current, video);
        rotationNeededRef.current = rotation;

        logDebugEvents(sessionId, [{ 
          event: 'video_ready', 
          phase: 'stream',
          data: { 
            videoWidth, 
            videoHeight,
            videoClientWidth: video.clientWidth,
            videoClientHeight: video.clientHeight,
            trackWidth: trackDimensionsRef.current.width,
            trackHeight: trackDimensionsRef.current.height,
            rotationDetected: rotation,
          } 
        }]);

        setTimeout(() => {
          const layout = getLayoutInfo(dialogRef.current, videoRef.current);
          logDebugEvents(sessionId, [{ 
            event: 'layout_measured',
            phase: 'layout',
            data: { layout, rotationApplied: rotation }
          }]);
        }, 250);

        setDebugInfo(prev => ({
          ...prev,
          status: 'active',
          videoWidth,
          videoHeight,
          rotationApplied: rotation,
        }));
        setStreamReady(true);

        decodeStartTimeRef.current = Date.now();

        // Custom decode loop with rotation support
        const runDecodeLoop = () => {
          if (!mounted || !videoRef.current || !readerRef.current) return;
          
          decodeAttemptsRef.current++;
          const video = videoRef.current;
          const currentRotation = rotationNeededRef.current;
          
          // Try decode with detected rotation first, then fallback
          let result = decodeWithRotation(video, readerRef.current, currentRotation);
          let usedRotation = currentRotation;
          
          // If primary rotation fails and we're supposed to rotate, also try 0
          if (!result && currentRotation !== 0) {
            result = decodeWithRotation(video, readerRef.current, 0);
            usedRotation = 0;
          }

          if (result) {
            const layout = getLayoutInfo(dialogRef.current, video);
            
            logDebugEvents(sessionId, [{ 
              event: 'barcode_detected',
              phase: 'decode',
              data: { 
                code: result.text,
                format: result.format,
                rotationUsed: usedRotation,
                attempts: decodeAttemptsRef.current,
                layout,
              } 
            }]);

            // Show success state with delay
            setSuccessState({ code: result.text, format: result.format });
            setDebugInfo(prev => ({ ...prev, status: 'success' }));
            
            // Delay before calling onScan to show success feedback
            setTimeout(() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              readerRef.current = null;
              streamRef.current = null;
              onScan(result.text);
            }, 1200);
            return;
          }

          // Track errors
          const errKey = 'NotFoundException';
          errorCountsRef.current.set(errKey, (errorCountsRef.current.get(errKey) || 0) + 1);

          // Update UI periodically
          if (decodeAttemptsRef.current <= 3 || decodeAttemptsRef.current % 30 === 0) {
            setDebugInfo(prev => ({
              ...prev,
              decodeAttempts: decodeAttemptsRef.current,
              lastError: 'No barcode detected',
            }));
          }

          // Log heartbeat every 100 attempts
          if (decodeAttemptsRef.current % 100 === 0) {
            const elapsed = (Date.now() - decodeStartTimeRef.current) / 1000;
            const rate = decodeAttemptsRef.current / elapsed;
            
            const topErrors = Array.from(errorCountsRef.current.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([key, count]) => ({ key, count }));
            
            const currentDims = {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              clientWidth: video.clientWidth,
              clientHeight: video.clientHeight,
            };
            
            logDebugEvents(sessionId, [{ 
              event: 'decode_heartbeat',
              phase: 'decode',
              data: { 
                attempts: decodeAttemptsRef.current,
                elapsedSec: Math.round(elapsed),
                rate: Math.round(rate * 10) / 10,
                rotationApplied: currentRotation,
                topErrors,
                currentDims,
              } 
            }]);
          }

          // Continue loop
          decodeLoopRef.current = requestAnimationFrame(runDecodeLoop);
        };

        // Start decode loop
        decodeLoopRef.current = requestAnimationFrame(runDecodeLoop);

      } catch (err) {
        console.error('Scanner error:', err);
        
        const errorName = err instanceof Error ? err.name : 'unknown';
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const layout = getLayoutInfo(dialogRef.current, videoRef.current);
        
        logDebugEvents(sessionId, [{ 
          event: 'scanner_error',
          phase: 'error',
          data: { 
            errorName,
            errorMessage,
            layout,
          } 
        }]);

        if (mounted) {
          if (err instanceof Error) {
            if (err.message.includes('Permission') || err.name === 'NotAllowedError') {
              setError('Camera permission denied. Please allow camera access and try again.');
            } else if (err.message.includes('NotFoundError') || err.name === 'NotFoundError') {
              setError('No camera found on this device.');
            } else {
              setError(`Could not start camera: ${err.message}`);
            }
          } else {
            setError('Could not start camera. Please try again.');
          }
          setDebugInfo(prev => ({ ...prev, status: 'error', lastError: errorMessage }));
          setIsStarting(false);
        }
      }
    };

    startScanner();

    const handleOrientationChange = () => {
      const layout = getLayoutInfo(dialogRef.current, videoRef.current);
      const orientation = screen.orientation ? {
        type: screen.orientation.type,
        angle: screen.orientation.angle,
      } : null;
      
      logDebugEvents(sessionId, [{
        event: 'orientation_change',
        phase: 'layout',
        data: { orientation, layout }
      }]);
    };

    const handleViewportResize = () => {
      const vv = window.visualViewport;
      const layout = getLayoutInfo(dialogRef.current, videoRef.current);
      
      logDebugEvents(sessionId, [{
        event: 'viewport_resize',
        phase: 'layout',
        data: { 
          visualViewport: vv ? {
            width: vv.width,
            height: vv.height,
            scale: vv.scale,
          } : null,
          layout,
        }
      }]);
    };

    screen.orientation?.addEventListener('change', handleOrientationChange);
    window.visualViewport?.addEventListener('resize', handleViewportResize);

    return () => {
      mounted = false;
      screen.orientation?.removeEventListener('change', handleOrientationChange);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      
      if (decodeLoopRef.current) {
        cancelAnimationFrame(decodeLoopRef.current);
        decodeLoopRef.current = null;
      }
      
      logDebugEvents(sessionId, [{
        event: 'scanner_session_end',
        phase: 'close',
        data: { 
          totalAttempts: decodeAttemptsRef.current,
          durationSec: Math.round((Date.now() - decodeStartTimeRef.current) / 1000),
        }
      }]);
      
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [open, onScan, decodeWithRotation]);

  const handleClose = () => {
    if (decodeLoopRef.current) {
      cancelAnimationFrame(decodeLoopRef.current);
      decodeLoopRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent 
        ref={dialogRef}
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 translate-x-0 w-auto max-w-none sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="w-full h-[180px] bg-black rounded-lg overflow-hidden relative">
                <video 
                  ref={videoRef}
                  className={`w-full h-full object-cover bg-black transition-opacity duration-200 ${
                    streamReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scan region indicator - corner brackets for 1D barcodes */}
                {!successState && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] h-[100px] relative">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
                    </div>
                  </div>
                )}
                
                {/* Success overlay */}
                {successState && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center animate-fade-in">
                    <div className="bg-green-500/20 rounded-full p-4 mb-3 animate-scale-in">
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <p className="text-white font-semibold text-lg mb-1">Barcode detected!</p>
                    <p className="text-white/80 font-mono text-sm">{successState.code}</p>
                  </div>
                )}
              </div>


              {/* Manual Capture Button */}
              {!isStarting && debugInfo.status === 'active' && (
                <Button 
                  onClick={handleManualCapture}
                  variant="secondary"
                  className="w-full"
                >
                  <ScanLine className="h-4 w-4 mr-2" />
                  Capture Now
                </Button>
              )}

              {isStarting && (
                <p className="text-center text-muted-foreground text-sm">
                  Starting camera...
                </p>
              )}
              <p className="text-center text-muted-foreground text-sm">
                Hold steady, about 6 inches away
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
