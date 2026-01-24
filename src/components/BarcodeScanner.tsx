import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

// Barcode formats to support (UPC/EAN for products, CODE_128/39 for general, RSS for produce)
const formatsToSupport = [
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.RSS_14,        // GS1 DataBar (produce like bananas)
  Html5QrcodeSupportedFormats.RSS_EXPANDED,  // GS1 DataBar Expanded
];
import { X, Camera } from 'lucide-react';
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

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleManualCapture = async () => {
    if (!scannerRef.current) {
      setDebugInfo('Scanner not initialized');
      return;
    }

    try {
      setDebugInfo('Checking scanner...');
      
      // Check if native BarcodeDetector is available
      const hasNativeAPI = 'BarcodeDetector' in window;
      console.log('Native BarcodeDetector available:', hasNativeAPI);
      
      let nativeFormats: string[] = [];
      if (hasNativeAPI) {
        try {
          nativeFormats = await (window as any).BarcodeDetector.getSupportedFormats();
          console.log('Supported native formats:', nativeFormats);
        } catch (e) {
          console.log('Could not get native formats:', e);
        }
      }
      
      // Get scanner state
      const state = scannerRef.current.getState();
      console.log('Scanner state:', state);
      
      const stateNames = ['NOT_STARTED', 'SCANNING', 'PAUSED', 'UNKNOWN'];
      const stateName = stateNames[state] || 'UNKNOWN';
      
      const info = [
        `State: ${stateName}`,
        `Native API: ${hasNativeAPI ? 'YES' : 'NO'}`,
        hasNativeAPI ? `Formats: ${nativeFormats.join(', ')}` : 'Using JS fallback'
      ].join('\n');
      
      setDebugInfo(info);
      
    } catch (err) {
      console.error('Manual capture error:', err);
      setDebugInfo(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const scannerId = 'barcode-scanner-region';

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);

      try {
        // Wait for the container to be in the DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted) return;

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,                            // Higher FPS for better detection
            qrbox: { width: 280, height: 150 }, // Taller scan area for linear barcodes
            aspectRatio: 1.5,
            disableFlip: true,                  // Save processing cycles on mobile
          },
          (decodedText) => {
            console.log('Barcode detected:', decodedText);
            // Stop scanner before calling onScan to prevent multiple scans
            scanner.stop().catch(console.error);
            scannerRef.current = null;
            onScan(decodedText);
          },
          () => {
            // Ignore scan failures (no barcode in view)
          }
        );
      } catch (err) {
        console.error('Scanner error:', err);
        if (mounted) {
          if (err instanceof Error) {
            if (err.message.includes('Permission')) {
              setError('Camera permission denied. Please allow camera access and try again.');
            } else if (err.message.includes('NotFoundError')) {
              setError('No camera found on this device.');
            } else {
              setError('Could not start camera. Please try again.');
            }
          } else {
            setError('Could not start camera. Please try again.');
          }
        }
      } finally {
        if (mounted) {
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }
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
              <div 
                ref={containerRef}
                id="barcode-scanner-region" 
                className="w-full min-h-[250px] bg-muted rounded-lg overflow-hidden"
              />
              {isStarting && (
                <p className="text-center text-muted-foreground text-sm">
                  Starting camera...
                </p>
              )}
              <p className="text-center text-muted-foreground text-sm">
                Hold steady, about 6 inches away
              </p>
              {!isStarting && (
                <div className="space-y-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleManualCapture}
                    className="w-full"
                  >
                    Capture Now (Debug)
                  </Button>
                  {debugInfo && (
                    <pre className="text-center text-xs font-mono bg-muted p-2 rounded whitespace-pre-wrap">
                      {debugInfo}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
