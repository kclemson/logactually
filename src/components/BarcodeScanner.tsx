import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  BrowserMultiFormatReader, 
  DecodeHintType, 
  BarcodeFormat,
} from '@zxing/library';
import { Camera, ScanLine } from 'lucide-react';
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
  BarcodeFormat.RSS_14,        // GS1 DataBar (produce like bananas)
  BarcodeFormat.RSS_EXPANDED,  // GS1 DataBar Expanded
];

interface DebugInfo {
  status: 'starting' | 'active' | 'error' | 'captured';
  videoWidth: number;
  videoHeight: number;
  decodeAttempts: number;
  lastError: string | null;
  captureResult: string | null;
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
  
  // Sample every 4th pixel for speed
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += luminance;
    pixelCount++;
  }
  
  const meanLuminance = totalLuminance / pixelCount;
  
  // Compute variance for contrast
  let variance = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    variance += (luminance - meanLuminance) ** 2;
  }
  const stdDev = Math.sqrt(variance / pixelCount);
  
  // Simple edge detection (horizontal gradient)
  let edgeSum = 0;
  let edgeCount = 0;
  const width = canvas.width;
  for (let i = 4; i < data.length - 4; i += 16) {
    if ((i / 4) % width === 0) continue; // Skip row boundaries
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
    // Silently fail - don't break the scanner if logging fails
    console.error('Debug logging failed:', err);
  }
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    status: 'starting',
    videoWidth: 0,
    videoHeight: 0,
    decodeAttempts: 0,
    lastError: null,
    captureResult: null,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string>('');
  const decodeAttemptsRef = useRef(0);
  const decodeStartTimeRef = useRef<number>(0);
  const errorCountsRef = useRef<Map<string, number>>(new Map());

  // Manual capture function - uses ZXing's synchronous decode on video element
  const handleManualCapture = useCallback(() => {
    if (!readerRef.current || !videoRef.current) {
      setDebugInfo(prev => ({ ...prev, captureResult: 'No reader/video available' }));
      return;
    }

    const video = videoRef.current;
    const sessionId = sessionIdRef.current;
    
    // Capture frame stats before decode attempt
    let frameStats: Record<string, unknown> = {};
    try {
      const canvas = document.createElement('canvas');
      const targetWidth = 320;
      const scale = targetWidth / video.videoWidth;
      canvas.width = targetWidth;
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frameStats = computeFrameStats(canvas);
      }
    } catch (e) {
      frameStats = { error: 'Failed to compute frame stats' };
    }
    
    // Get current layout info
    const layout = getLayoutInfo(dialogRef.current, video);

    try {
      setDebugInfo(prev => ({ ...prev, captureResult: 'Capturing...', status: 'captured' }));
      
      const result = readerRef.current.decode(video);
      
      logDebugEvents(sessionId, [{ 
        event: 'manual_capture_success',
        phase: 'capture',
        data: { 
          code: result.getText(),
          frameStats,
          layout,
          attempts: decodeAttemptsRef.current,
        } 
      }]);
      
      // Success - close and return result
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      readerRef.current.reset();
      readerRef.current = null;
      streamRef.current = null;
      
      onScan(result.getText());
    } catch (err) {
      const errName = err instanceof Error ? err.name : 'unknown';
      const errMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setDebugInfo(prev => ({ 
        ...prev, 
        captureResult: `No barcode found`,
        status: 'active'
      }));
      
      logDebugEvents(sessionId, [{ 
        event: 'manual_capture_failed',
        phase: 'capture',
        data: { 
          errorName: errName,
          errorMessage: errMessage,
          frameStats,
          layout,
          attempts: decodeAttemptsRef.current,
        } 
      }]);
      
      setTimeout(() => {
        setDebugInfo(prev => ({ ...prev, captureResult: null }));
      }, 2000);
    }
  }, [onScan]);

  useEffect(() => {
    if (!open) return;

    // Generate new session ID
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    
    // Reset state for fresh start each time dialog opens
    setError(null);
    setIsStarting(true);
    decodeAttemptsRef.current = 0;
    decodeStartTimeRef.current = Date.now();
    errorCountsRef.current = new Map();
    setDebugInfo({
      status: 'starting',
      videoWidth: 0,
      videoHeight: 0,
      decodeAttempts: 0,
      lastError: null,
      captureResult: null,
    });

    let mounted = true;

    const startScanner = async () => {
      try {
        // Log session start with full environment
        const environment = getEnvironmentInfo();
        logDebugEvents(sessionId, [{ 
          event: 'scanner_session_start',
          phase: 'opening',
          data: { environment }
        }]);

        // Wait for video element to be in DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted || !videoRef.current) return;

        // Define constraints we'll request
        const requestedConstraints = {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        };

        // Step 1: Manually acquire the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: requestedConstraints
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        // Log track settings and capabilities
        const videoTrack = stream.getVideoTracks()[0];
        const trackSettings = videoTrack?.getSettings?.() ?? {};
        const trackCapabilities = videoTrack?.getCapabilities?.() ?? {};
        
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

        // Step 2: Wait for video metadata to load (ensures videoWidth > 0)
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
          
          // Timeout fallback
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

        // Step 3: Start playing the video
        await videoRef.current.play();

        if (!mounted) return;

        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        // Log layout after video is ready (with small delay for DOM update)
        setTimeout(() => {
          const layout = getLayoutInfo(dialogRef.current, videoRef.current);
          logDebugEvents(sessionId, [{ 
            event: 'layout_measured',
            phase: 'layout',
            data: { layout }
          }]);
        }, 250);

        logDebugEvents(sessionId, [{ 
          event: 'video_ready', 
          phase: 'stream',
          data: { 
            videoWidth, 
            videoHeight,
            videoClientWidth: videoRef.current.clientWidth,
            videoClientHeight: videoRef.current.clientHeight,
          } 
        }]);

        setDebugInfo(prev => ({
          ...prev,
          status: 'active',
          videoWidth,
          videoHeight,
        }));

        // Step 4: Configure ZXing decoder
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);

        const reader = new BrowserMultiFormatReader(hints);
        readerRef.current = reader;

        decodeStartTimeRef.current = Date.now();

        // Step 5: Start continuous decoding from the already-playing video element
        reader.decodeContinuously(videoRef.current, (result, err) => {
          decodeAttemptsRef.current++;
          
          // Track error counts by type
          if (err) {
            const errKey = `${err.name}:${err.message?.slice(0, 50)}`;
            errorCountsRef.current.set(errKey, (errorCountsRef.current.get(errKey) || 0) + 1);
          }
          
          // Update debug info periodically
          if (decodeAttemptsRef.current <= 3 || decodeAttemptsRef.current % 30 === 0) {
            setDebugInfo(prev => ({
              ...prev,
              decodeAttempts: decodeAttemptsRef.current,
              lastError: err?.message || null,
            }));
          }
          
          // Log heartbeat every 100 attempts with comprehensive info
          if (decodeAttemptsRef.current % 100 === 0) {
            const elapsed = (Date.now() - decodeStartTimeRef.current) / 1000;
            const rate = decodeAttemptsRef.current / elapsed;
            
            // Get top 3 errors
            const topErrors = Array.from(errorCountsRef.current.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([key, count]) => ({ key, count }));
            
            const video = videoRef.current;
            const currentDims = video ? {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              clientWidth: video.clientWidth,
              clientHeight: video.clientHeight,
            } : null;
            
            logDebugEvents(sessionId, [{ 
              event: 'decode_heartbeat',
              phase: 'decode',
              data: { 
                attempts: decodeAttemptsRef.current,
                elapsedSec: Math.round(elapsed),
                rate: Math.round(rate * 10) / 10,
                topErrors,
                currentDims,
              } 
            }]);
          }

          if (result) {
            const layout = getLayoutInfo(dialogRef.current, videoRef.current);
            
            logDebugEvents(sessionId, [{ 
              event: 'barcode_detected',
              phase: 'decode',
              data: { 
                code: result.getText(), 
                attempts: decodeAttemptsRef.current,
                format: result.getBarcodeFormat?.() ?? 'unknown',
                layout,
              } 
            }]);

            // Stop scanner before calling onScan to prevent multiple scans
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            reader.reset();
            readerRef.current = null;
            streamRef.current = null;
            
            onScan(result.getText());
          }
        });

        if (mounted) {
          setIsStarting(false);
        }
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

    // Orientation change handler
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

    // Visual viewport resize handler (important on iOS)
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
      
      // Log session end
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
  }, [open, onScan]);

  const handleClose = () => {
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
              <div className="w-full bg-black rounded-lg overflow-hidden relative">
                <video 
                  ref={videoRef}
                  className="w-full aspect-video object-contain bg-black"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scan region indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] max-w-[280px] h-[80px] border-2 border-primary/50 rounded-lg" />
                </div>
              </div>

              {/* Debug Info Display */}
              <div className="bg-muted/50 rounded-md p-2 text-xs font-mono space-y-1 overflow-hidden">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={debugInfo.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}>
                    {debugInfo.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Video:</span>
                  <span>{debugInfo.videoWidth} × {debugInfo.videoHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span>Decode attempts:</span>
                  <span>{debugInfo.decodeAttempts}</span>
                </div>
                {debugInfo.lastError && (
                  <div className="text-destructive break-words">
                    Last: {debugInfo.lastError}
                  </div>
                )}
                {debugInfo.captureResult && (
                  <div className="text-primary font-medium">
                    {debugInfo.captureResult}
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
