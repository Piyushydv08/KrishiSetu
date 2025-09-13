import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Copy, Check } from "lucide-react";
import type { Product } from "@shared/schema";

interface QRCodeGeneratorProps {
  product: Product;
}

export function QRCodeGenerator({ product }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    await navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Create a download link for the QR code
    const link = document.createElement("a");
    link.href = product.qrCode || '';
    link.download = `QR-${product.batchId || 'product'}.png`;
    link.click();
  };

  return (
    <Card className="shadow-sm border border-border">
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          QR Code
        </h3>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
          <img
            src={product.qrCode || ''}
            alt={`QR Code for ${product.name} - Batch ${product.batchId || ''}`}
            className="w-48 h-48"
            data-testid="img-qr-code"
          />
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <div data-testid="text-batch-id">
            <span className="font-medium">Batch ID:</span> {product.batchId}
          </div>
          <div data-testid="text-blockchain-hash">
            <span className="font-medium">Blockchain:</span>{" "}
            {product.blockchainHash?.slice(0, 12)}...
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-copy-link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
