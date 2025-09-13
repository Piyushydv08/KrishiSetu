import { useParams } from 'wouter';
import { NavigationHeader } from '@/components/NavigationHeader';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { useProduct } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Calendar, Package, User, ShieldCheck, Clock, Truck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

export default function ProductDetails() {
  const params = useParams();
  const productId = params.id as string;
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <NavigationHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <NavigationHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-destructive mb-4">Product not found</div>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <NavigationHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h2 className="text-3xl font-bold text-foreground" data-testid="text-product-title">
            {product.name}
          </h2>
          <p className="text-muted-foreground mt-1">
            Batch #{product.batchId} • Registered {formatDistanceToNow(new Date(product.createdAt!), { addSuffix: true })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Product Overview */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <h3 className="text-xl font-semibold text-foreground">Product Overview</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Category</div>
                        <div className="text-sm text-muted-foreground capitalize" data-testid="text-product-category">
                          {product.category}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Quantity</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-product-quantity">
                          {product.quantity} {product.unit}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Farm/Producer</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-farm-name">
                          {product.farmName}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Origin Location</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-product-location">
                          {product.location}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Harvest Date</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-harvest-date">
                          {new Date(product.harvestDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Status</div>
                        <Badge 
                          variant="secondary" 
                          className={`${
                            product.status === 'delivered' ? 'bg-verified/10 text-verified border-verified/20' :
                            product.status === 'in_transit' ? 'bg-accent/10 text-accent border-accent/20' :
                            'bg-warning/10 text-warning border-warning/20'
                          }`}
                          data-testid="badge-product-status"
                        >
                          {product.status === 'in_transit' ? 'In Transit' : 
                           product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {product.description && (
                  <div className="pt-4 border-t border-border">
                    <div className="text-sm font-medium text-foreground mb-2">Description</div>
                    <p className="text-sm text-muted-foreground" data-testid="text-product-description">
                      {product.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Blockchain Verification */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <h3 className="text-xl font-semibold text-foreground">Blockchain Verification</h3>
              </CardHeader>
              <CardContent>
                <div className="relative p-4 bg-verified/10 border border-verified/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-verified mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">Verified on Blockchain</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Transaction Hash:
                        <span className="font-mono ml-1 break-all" data-testid="text-blockchain-hash">
                          {product.blockchainHash}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-verified text-white border-0">
                      Verified
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Certifications */}
            {product.certifications && product.certifications.length > 0 && (
              <Card className="shadow-sm border border-border">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-foreground">Certifications</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((cert) => (
                      <Badge 
                        key={cert} 
                        variant="outline" 
                        className="bg-primary/10 text-primary border-primary/20"
                        data-testid={`badge-certification-${cert.toLowerCase().replace(' ', '-')}`}
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <QRCodeGenerator product={product} />
            
            {/* Quick Stats */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">Quick Stats</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Scans</span>
                  <span className="font-medium text-foreground" data-testid="text-scan-count">142</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="font-medium text-foreground" data-testid="text-transaction-count">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quality Score</span>
                  <span className="font-medium text-verified" data-testid="text-quality-score">95%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
