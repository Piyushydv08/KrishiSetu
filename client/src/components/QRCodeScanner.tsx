import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProductByBatch } from "@/hooks/useProducts";
import { Camera, StopCircle, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

export function QRCodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBatchId, setScannedBatchId] = useState<string>("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const { toast } = useToast();

  const { data: product, isLoading, error } = useProductByBatch(scannedBatchId);

  // Start camera and QR scanning
  const startScanning = async () => {
    setScanError(null);
    setScannedBatchId("");
    try {
      setIsScanning(true);
      codeReaderRef.current = new BrowserQRCodeReader();
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices[0]?.deviceId;

      if (videoRef.current && selectedDeviceId) {
        scanTimeoutRef.current = setTimeout(() => {
          stopScanning();
          setScanError("No QR code detected. Please try again.");
          toast({
            title: "No QR Code Detected",
            description: "No QR code was found. Please try again.",
            variant: "destructive",
          });
        }, 20000);

        codeReaderRef.current
          .decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                clearTimeout(scanTimeoutRef.current!);
                const text = result.getText();
                if (!text || text.trim() === "") {
                  setScanError("Scanned QR code does not contain a batch ID.");
                  toast({
                    title: "Invalid QR Code",
                    description: "Scanned QR code does not contain a batch ID.",
                    variant: "destructive",
                  });
                  stopScanning();
                  return;
                }
                setScannedBatchId(text.trim());
                setScanError(null);
                stopScanning();
              }
            }
          )
          .then((controls) => {
            controlsRef.current = controls;
          });

        toast({
          title: "Camera Started",
          description: "Point your camera at a FarmTrace QR code",
        });
      } else {
        throw new Error("No camera found");
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please ensure camera permissions are granted.",
        variant: "destructive",
      });
      setScanError("Unable to access camera. Please ensure camera permissions are granted.");
      setIsScanning(false);
      console.error("Camera error:", error);
    }
  };

  // Stop camera and scanning
  const stopScanning = () => {
    setIsScanning(false);

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
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
      setScanError(`No product found with batch ID: ${scannedBatchId}`);
      toast({
        title: "Product Not Found",
        description: `No product found with batch ID: ${scannedBatchId}`,
        variant: "destructive",
      });
      setScannedBatchId("");
    }
    // eslint-disable-next-line
  }, [product, isLoading, error, navigate, toast, scannedBatchId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-sm border border-border">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div
              className="relative bg-muted rounded-lg overflow-hidden"
              style={{ aspectRatio: "4/3" }}
            >
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
            {scanError && (
              <div className="flex items-center justify-center text-red-600 text-sm mt-2 gap-2">
                <AlertTriangle className="w-4 h-4" />
                {scanError}
              </div>
            )}
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
                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-stop-camera"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop
                </Button>
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
