import { useEffect, useRef, useState } from 'react';
import { 
  BrowserMultiFormatReader, 
  DecodeHintType, 
  BarcodeFormat,
} from '@zxing/library';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!open) return;

    // Reset state for fresh start each time dialog opens
    setError(null);
    setIsStarting(true);

    let mounted = true;

    const startScanner = async () => {
      try {
        // Wait for video element to be in DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted || !videoRef.current) return;

        // Configure decoder with TRY_HARDER for reliable 1D barcode detection
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);

        const reader = new BrowserMultiFormatReader(hints);
        readerRef.current = reader;

        // Start continuous scanning - let ZXing handle camera selection
        // Passing undefined uses the default back camera via facingMode: 'environment'
        let decodeAttempts = 0;
        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            decodeAttempts++;
            // Log every 30th attempt to avoid spam, but always log first few
            if (decodeAttempts <= 3 || decodeAttempts % 30 === 0) {
              console.log(`Decode attempt #${decodeAttempts}:`, {
                hasResult: !!result,
                error: err?.message || 'none',
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight,
              });
            }
            if (result) {
              console.log('Barcode detected:', result.getText());
              // Stop scanner before calling onScan to prevent multiple scans
              reader.stopContinuousDecode();
              reader.reset();
              readerRef.current = null;
              onScan(result.getText());
            }
          }
        );
        
        // Log video state after scanner starts
        console.log('Scanner initialized, video state:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
          paused: videoRef.current.paused,
        });

        if (mounted) {
          setIsStarting(false);
        } else {
          reader.reset();
        }
      } catch (err) {
        console.error('Scanner error:', err);
        if (err instanceof Error) {
          console.error('Error name:', err.name, 'Message:', err.message);
        }
        if (mounted) {
          if (err instanceof Error) {
            if (err.message.includes('Permission') || err.name === 'NotAllowedError') {
              setError('Camera permission denied. Please allow camera access and try again.');
            } else if (err.message.includes('NotFoundError') || err.name === 'NotFoundError') {
              setError('No camera found on this device.');
            } else {
              setError('Could not start camera. Please try again.');
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
      if (readerRef.current) {
        readerRef.current.stopContinuousDecode();
        readerRef.current.reset();
        readerRef.current = null;
      }
    };
  }, [open, onScan]);

  const handleClose = () => {
    if (readerRef.current) {
      readerRef.current.stopContinuousDecode();
      readerRef.current.reset();
      readerRef.current = null;
    }
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
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
              <div className="w-full min-h-[250px] bg-muted rounded-lg overflow-hidden relative">
                <video 
                  ref={videoRef}
                  className="w-full h-[250px] object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scan region indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[280px] h-[100px] border-2 border-primary/50 rounded-lg" />
                </div>
              </div>
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
