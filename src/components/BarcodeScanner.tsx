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
import { logger } from '@/lib/logger';

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
  
  if (trackIsLandscape !== videoIsLandscape) {
    return 90;
  }
  return 0;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decodeAttemptsRef = useRef(0);
  const trackDimensionsRef = useRef<TrackDimensions>({ width: 0, height: 0 });
  const rotationNeededRef = useRef<number>(0);
  const decodeLoopRef = useRef<number | null>(null);
  // Tracks consecutive identical EAN-8 reads; require 5 before accepting to avoid
  // misreading UPC-A barcodes (ZXing finds valid EAN-8 checksum within the 12-digit bars)
  const ean8StreakRef = useRef<{ code: string; count: number }>({ code: '', count: 0 });

  // Rotation-aware decode from video element
  const decodeWithRotation = useCallback((
    video: HTMLVideoElement,
    reader: BrowserMultiFormatReader,
    rotation: number
  ): { text: string; format: string } | null => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    
    if (vw === 0 || vh === 0) return null;

    if (rotation === 90 || rotation === 270) {
      canvas.width = vh;
      canvas.height = vw;
    } else {
      canvas.width = vw;
      canvas.height = vh;
    }

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
    if (!readerRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const reader = readerRef.current;
    const rotation = rotationNeededRef.current;

    const rotationsToTry = rotation !== 0 ? [rotation, 0, 180, 270] : [0, 90, 180, 270];
    let result: { text: string; format: string } | null = null;

    for (const rot of rotationsToTry) {
      result = decodeWithRotation(video, reader, rot);
      if (result) break;
    }

    if (result) {
      // For manual capture reject EAN-8 since it may be a misread of a longer UPC-A
      if (result.format === 'EAN_8') {
        logger.log('Manual capture: EAN-8 rejected on single frame, continuing scan');
        return;
      }

      if (decodeLoopRef.current) {
        cancelAnimationFrame(decodeLoopRef.current);
        decodeLoopRef.current = null;
      }
      
      setSuccessState({ code: result.text, format: result.format });
      
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        readerRef.current = null;
        ean8StreakRef.current = { code: '', count: 0 };
        streamRef.current = null;
        onScan(result.text);
      }, 1200);
    }
  }, [onScan, decodeWithRotation]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setIsStarting(true);
    decodeAttemptsRef.current = 0;
    rotationNeededRef.current = 0;
    setSuccessState(null);
    setStreamReady(false);

    let mounted = true;

    const startScanner = async () => {
      try {
        const reader = new BrowserMultiFormatReader(DECODER_HINTS);
        readerRef.current = reader;

        const maxWaitMs = 2000;
        const pollIntervalMs = 50;
        let waited = 0;
        
        while (!videoRef.current && waited < maxWaitMs) {
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
          waited += pollIntervalMs;
        }
        
        if (!mounted) return;
        
        if (!videoRef.current) {
          setError('Camera initialization failed. Please try again.');
          setIsStarting(false);
          return;
        }

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

        const videoTrack = stream.getVideoTracks()[0];
        const trackSettings = videoTrack?.getSettings?.() ?? {};
        
        trackDimensionsRef.current = {
          width: trackSettings.width || 0,
          height: trackSettings.height || 0,
        };

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

        setIsStarting(false);

        const video = videoRef.current;

        const rotation = detectRotationNeeded(trackDimensionsRef.current, video);
        rotationNeededRef.current = rotation;

        setStreamReady(true);

        // Custom decode loop with rotation support
        const runDecodeLoop = () => {
          if (!mounted || !videoRef.current || !readerRef.current) return;
          
          decodeAttemptsRef.current++;
          const video = videoRef.current;
          const currentRotation = rotationNeededRef.current;
          
          let result = decodeWithRotation(video, readerRef.current, currentRotation);
          
          if (!result && currentRotation !== 0) {
            result = decodeWithRotation(video, readerRef.current, 0);
          }

          if (result) {
            if (result.format === 'EAN_8') {
              if (ean8StreakRef.current.code === result.text) {
                ean8StreakRef.current.count++;
              } else {
                ean8StreakRef.current = { code: result.text, count: 1 };
              }

              if (ean8StreakRef.current.count < 5) {
                logger.log(`EAN-8 streak ${ean8StreakRef.current.count}/5 for ${result.text}, continuing...`);
                decodeLoopRef.current = requestAnimationFrame(runDecodeLoop);
                return;
              }

              logger.log('EAN-8 confirmed as genuine after 5 frames:', result.text);
              ean8StreakRef.current = { code: '', count: 0 };
            } else {
              ean8StreakRef.current = { code: '', count: 0 };
            }

            setSuccessState({ code: result.text, format: result.format });
            
            setTimeout(() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              readerRef.current = null;
              ean8StreakRef.current = { code: '', count: 0 };
              streamRef.current = null;
              onScan(result.text);
            }, 1200);
            return;
          }

          decodeLoopRef.current = requestAnimationFrame(runDecodeLoop);
        };

        decodeLoopRef.current = requestAnimationFrame(runDecodeLoop);

      } catch (err) {
        console.error('Scanner error:', err);

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
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      
      if (decodeLoopRef.current) {
        cancelAnimationFrame(decodeLoopRef.current);
        decodeLoopRef.current = null;
      }
      
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
      ean8StreakRef.current = { code: '', count: 0 };
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
                {!successState && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] h-[100px] relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
                    </div>
                  </div>
                )}
                
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

              {!isStarting && !successState && (
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
