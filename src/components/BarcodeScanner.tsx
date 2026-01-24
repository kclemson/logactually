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

// Send debug events to backend for logging
async function logDebugEvents(events: Array<{ event: string; data?: Record<string, unknown> }>) {
  try {
    await supabase.functions.invoke('log-scanner-debug', {
      body: { events: events.map(e => ({ ...e, timestamp: new Date().toISOString() })) }
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
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decodeAttemptsRef = useRef(0);

  // Manual capture function - uses ZXing's synchronous decode on video element
  const handleManualCapture = useCallback(() => {
    if (!readerRef.current || !videoRef.current) {
      setDebugInfo(prev => ({ ...prev, captureResult: 'No reader/video available' }));
      return;
    }

    try {
      setDebugInfo(prev => ({ ...prev, captureResult: 'Capturing...', status: 'captured' }));
      
      const video = videoRef.current;
      
      // Use ZXing's synchronous decode method on the video element
      const result = readerRef.current.decode(video);
      
      logDebugEvents([{ 
        event: 'manual_capture_success', 
        data: { code: result.getText() } 
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      setDebugInfo(prev => ({ 
        ...prev, 
        captureResult: `No barcode found`,
        status: 'active'
      }));
      
      logDebugEvents([{ 
        event: 'manual_capture_failed', 
        data: { error: message } 
      }]);
      
      // Clear the message after 2 seconds
      setTimeout(() => {
        setDebugInfo(prev => ({ ...prev, captureResult: null }));
      }, 2000);
    }
  }, [onScan]);

  useEffect(() => {
    if (!open) return;

    // Reset state for fresh start each time dialog opens
    setError(null);
    setIsStarting(true);
    decodeAttemptsRef.current = 0;
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
        logDebugEvents([{ event: 'scanner_opening' }]);

        // Wait for video element to be in DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted || !videoRef.current) return;

        // Step 1: Manually acquire the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 16/9 }
          }
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

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

        logDebugEvents([{ 
          event: 'stream_ready', 
          data: { videoWidth, videoHeight } 
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

        // Step 5: Start continuous decoding from the already-playing video element
        reader.decodeContinuously(videoRef.current, (result, err) => {
          decodeAttemptsRef.current++;
          
          // Update debug info periodically
          if (decodeAttemptsRef.current <= 3 || decodeAttemptsRef.current % 30 === 0) {
            setDebugInfo(prev => ({
              ...prev,
              decodeAttempts: decodeAttemptsRef.current,
              lastError: err?.message || null,
            }));
            
            // Log to backend every 100 attempts
            if (decodeAttemptsRef.current % 100 === 0) {
              logDebugEvents([{ 
                event: 'decode_progress', 
                data: { 
                  attempts: decodeAttemptsRef.current,
                  lastError: err?.message || null,
                } 
              }]);
            }
          }

          if (result) {
            logDebugEvents([{ 
              event: 'barcode_detected', 
              data: { code: result.getText(), attempts: decodeAttemptsRef.current } 
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
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logDebugEvents([{ 
          event: 'scanner_error', 
          data: { error: errorMessage, name: err instanceof Error ? err.name : 'unknown' } 
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

    return () => {
      mounted = false;
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
      <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-md">
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
              <div className="bg-muted/50 rounded-md p-2 text-xs font-mono space-y-1">
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
                  <div className="text-destructive truncate">
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
