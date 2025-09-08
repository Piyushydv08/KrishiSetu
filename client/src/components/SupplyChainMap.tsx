import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Sprout, Factory, Warehouse, Store, Plus, Minus, Expand, Calendar } from 'lucide-react';

interface JourneyStep {
  id: string;
  name: string;
  location: string;
  date: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
}

export function SupplyChainMap() {
  const { user } = useAuth();
  const { data: products, isLoading } = useProducts(user?.id);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const selectedProduct = products?.find(p => p.id === selectedProductId) || products?.[0];

  // Mock journey steps - in a real app, this would come from transactions
  const journeySteps: JourneyStep[] = [
    {
      id: '1',
      name: selectedProduct?.farmName || 'Sunny Acres Farm',
      location: selectedProduct?.location || 'Fresno, CA',
      date: 'Jan 10',
      status: 'Harvested',
      icon: Sprout,
      bgColor: 'bg-primary',
      textColor: 'text-primary-foreground'
    },
    {
      id: '2', 
      name: 'Fresh Pack Co.',
      location: 'Salinas, CA',
      date: 'Jan 12',
      status: 'Processed',
      icon: Factory,
      bgColor: 'bg-accent',
      textColor: 'text-accent-foreground'
    },
    {
      id: '3',
      name: 'Central Distribution',
      location: 'Los Angeles, CA', 
      date: 'Jan 14',
      status: 'Shipped',
      icon: Warehouse,
      bgColor: 'bg-warning',
      textColor: 'text-white'
    },
    {
      id: '4',
      name: 'Green Market',
      location: 'San Francisco, CA',
      date: 'In Transit',
      status: 'Delivering',
      icon: Store,
      bgColor: 'bg-secondary',
      textColor: 'text-secondary-foreground'
    }
  ];

  const journeyStats = {
    verifiedStages: 4,
    totalDistance: '847 mi',
    journeyTime: '5 days',
    avgTemperature: '68°F'
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-border overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-border overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Supply Chain Journey
          </h3>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-64" data-testid="select-product-filter">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products?.map((product) => (
                <SelectItem key={product.id} value={product.id} data-testid={`select-option-${product.id}`}>
                  {product.batchId} - {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-96 map-container relative bg-gradient-to-b from-blue-50/50 to-green-50/50 dark:from-blue-950/20 dark:to-green-950/20">
          {/* Mock Interactive Map */}
          <div className="w-full h-full flex items-center justify-center">
            {/* Illustrated supply chain path with locations */}
            <div className="relative w-full max-w-4xl px-8">
              {/* Background map illustration */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg"></div>
              </div>
              
              {/* Journey Steps */}
              <div className="relative z-10 flex items-center justify-between h-full">
                {journeySteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="text-center group">
                      <div className={`w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform`} data-testid={`journey-step-${step.id}`}>
                        <step.icon className={`w-5 h-5 ${step.textColor}`} />
                      </div>
                      <div className="text-xs font-medium text-foreground" data-testid={`text-step-name-${step.id}`}>
                        {step.name}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-step-location-${step.id}`}>
                        {step.location}
                      </div>
                      <div className="text-xs text-verified font-medium mt-1 flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span data-testid={`text-step-date-${step.id}`}>{step.date}</span>
                      </div>
                    </div>
                    
                    {/* Connection line */}
                    {index < journeySteps.length - 1 && (
                      <div className="flex items-center mx-4">
                        <div className="w-16 h-px bg-border relative">
                          <div className="absolute inset-0 bg-primary animate-pulse opacity-60"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button size="icon" variant="outline" className="w-8 h-8" data-testid="button-zoom-in">
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="w-8 h-8" data-testid="button-zoom-out">
              <Minus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="w-8 h-8" data-testid="button-expand-map">
              <Expand className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Journey Details */}
        <div className="p-6 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-verified" data-testid="text-verified-stages">
                {journeyStats.verifiedStages}
              </div>
              <div className="text-xs text-muted-foreground">Verified Stages</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground" data-testid="text-total-distance">
                {journeyStats.totalDistance}
              </div>
              <div className="text-xs text-muted-foreground">Total Distance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-accent" data-testid="text-journey-time">
                {journeyStats.journeyTime}
              </div>
              <div className="text-xs text-muted-foreground">Journey Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary" data-testid="text-avg-temperature">
                {journeyStats.avgTemperature}
              </div>
              <div className="text-xs text-muted-foreground">Avg Temperature</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
