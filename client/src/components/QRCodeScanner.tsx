import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProductByBatch } from '@/hooks/useProducts';
import { Camera, StopCircle, Scan } from 'lucide-react';
import { useLocation } from 'wouter';

export function QRCodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBatchId, setScannedBatchId] = useState<string>('');
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const { data: product, isLoading, error } = useProductByBatch(scannedBatchId);

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        // In a real implementation, you would integrate with a QR code scanning library
        // like @zxing/library or qr-scanner here
        
        toast({
          title: "Camera Started",
          description: "Point your camera at a FarmTrace QR code",
        });
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please ensure camera permissions are granted.",
        variant: "destructive"
      });
      console.error('Camera error:', error);
    }
  }, [toast]);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Mock QR code detection - in real implementation this would be handled by QR scanning library
  const handleMockScan = () => {
    // Simulate scanning a QR code with batch ID
    const mockBatchIds = ['TOM-2024-001', 'EGG-2024-047', 'GRN-2024-022'];
    const randomBatchId = mockBatchIds[Math.floor(Math.random() * mockBatchIds.length)];
    setScannedBatchId(randomBatchId);
    stopScanning();
  };

  // Navigate to product details when product is found
  useEffect(() => {
    if (product && !isLoading && !error) {
      navigate(`/product/${product.id}`);
      
      toast({
        title: "Product Found!",
        description: `${product.name} - ${product.batchId}`,
      });
    } else if (error && scannedBatchId) {
      toast({
        title: "Product Not Found",
        description: `No product found with batch ID: ${scannedBatchId}`,
        variant: "destructive"
      });
      setScannedBatchId('');
    }
  }, [product, isLoading, error, navigate, toast, scannedBatchId]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-sm border border-border">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {isScanning ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    data-testid="video-camera"
                  />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 border-2 border-accent rounded-lg">
                    <div className="absolute inset-4 border border-accent/50 rounded-lg">
                      <div className="scan-line absolute top-0 left-0 right-0 h-0.5 bg-accent"></div>
                    </div>
                  </div>
                  
                  {/* Corner brackets */}
                  <div className="absolute top-8 left-8 w-6 h-6 border-l-2 border-t-2 border-accent"></div>
                  <div className="absolute top-8 right-8 w-6 h-6 border-r-2 border-t-2 border-accent"></div>
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-l-2 border-b-2 border-accent"></div>
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-r-2 border-b-2 border-accent"></div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Camera is ready to scan QR codes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Position the QR code within the frame to scan
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-3">
              {!isScanning ? (
                <Button 
                  onClick={startScanning}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2"
                  data-testid="button-start-camera"
                >
                  <Camera className="w-4 h-4" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={stopScanning}
                    variant="outline"
                    className="flex items-center gap-2"
                    data-testid="button-stop-camera"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop
                  </Button>
                  <Button 
                    onClick={handleMockScan}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                    data-testid="button-simulate-scan"
                  >
                    <Scan className="w-4 h-4" />
                    Simulate Scan
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">Scanning Instructions:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Hold your device steady</li>
              <li>Position the QR code within the frame</li>
              <li>Ensure good lighting</li>
              <li>Keep the QR code flat and undamaged</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
