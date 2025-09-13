import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { User } from "@shared/schema";
import {
  Sprout,
  Truck,
  Store,
  Users,
  TrendingUp,
  Package,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  Award,
  Leaf,
} from "lucide-react";

interface RoleDashboardProps {
  user: User;
  onRegisterProduct?: () => void;
  onScanQR?: () => void;
}

export function RoleDashboard({
  user,
  onRegisterProduct,
  onScanQR,
}: RoleDashboardProps) {
  const { role } = user;

  // Mock data - in real app this would come from API
  const mockStats = {
    farmer: {
      totalProducts: 24,
      activeHarvests: 3,
      qualityScore: 92,
      monthlyRevenue: "$12,450",
      pendingOrders: 7,
      certifications: ["Organic", "Fair Trade"],
      seasonalTips: "Consider planting winter crops for continuous harvest",
    },
    distributor: {
      totalShipments: 156,
      activeRoutes: 8,
      onTimeDelivery: 94,
      monthlyVolume: "2,340 kg",
      pendingPickups: 12,
      vehicles: ["Truck A", "Truck B", "Van C"],
      alerts: "Temperature alert on Route 3",
    },
    retailer: {
      totalProducts: 89,
      dailySales: 47,
      inventoryTurnover: 87,
      customerSatisfaction: 4.6,
      lowStockItems: 5,
      topCategories: ["Vegetables", "Fruits", "Herbs"],
      promotion: "15% off organic produce this week",
    },
    consumer: {
      scannedProducts: 18,
      favoriteOrigins: ["Local Farm Co", "Green Valley"],
      sustainabilityScore: 85,
      monthlySpending: "$340",
      trackedItems: 6,
      impactReduction: "12% less CO2 this month",
      recommendations: "Try locally grown tomatoes",
    },
  };

  const stats = mockStats[role as keyof typeof mockStats] || mockStats.farmer;

  const renderFarmerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Active Harvests */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            Active Harvests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Organic Tomatoes</span>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Ready in 5 days
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Sweet Corn</span>
              <Badge variant="outline" className="bg-warning/10 text-warning">
                Harvesting
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Bell Peppers</span>
              <Badge variant="outline" className="bg-accent/10 text-accent">
                Growing
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-verified" />
            Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(stats as any).certifications.map((cert: string) => (
              <Badge
                key={cert}
                className="bg-verified text-white w-full justify-center"
              >
                {cert}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDistributorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Active Routes */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Active Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Route A: Farm → Warehouse</span>
              <Badge className="bg-verified text-white">In Transit</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Route B: Warehouse → Market</span>
              <Badge className="bg-warning text-white">Loading</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Route C: Market → Store</span>
              <Badge className="bg-accent text-white">Scheduled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {(stats as any).alerts}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRetailerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Categories */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-accent" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats as any).topCategories.map(
              (category: string, index: number) => (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">{category}</span>
                  <Badge
                    variant="outline"
                    className={
                      index === 0
                        ? "bg-primary/10 text-primary"
                        : index === 1
                        ? "bg-verified/10 text-verified"
                        : "bg-accent/10 text-accent"
                    }
                  >
                    Best Seller
                  </Badge>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promotion */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-warning" />
            Active Promotion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {(stats as any).promotion}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConsumerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Favorite Origins */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Favorite Origins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats as any).favoriteOrigins.map((origin: string) => (
              <div key={origin} className="flex items-center justify-between">
                <span className="font-medium">{origin}</span>
                <Badge
                  variant="outline"
                  className="bg-verified/10 text-verified"
                >
                  Trusted
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impact */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {(stats as any).impactReduction}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getRoleIcon = () => {
    switch (role) {
      case "farmer":
        return <Sprout className="w-5 h-5" />;
      case "distributor":
        return <Truck className="w-5 h-5" />;
      case "retailer":
        return <Store className="w-5 h-5" />;
      case "consumer":
        return <Users className="w-5 h-5" />;
      default:
        return <Sprout className="w-5 h-5" />;
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case "farmer":
        return "Farmer Dashboard";
      case "distributor":
        return "Distributor Dashboard";
      case "retailer":
        return "Retailer Dashboard";
      case "consumer":
        return "Consumer Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case "farmer":
        return "Manage your harvests, track quality, and register new products";
      case "distributor":
        return "Monitor shipments, optimize routes, and track deliveries";
      case "retailer":
        return "Manage inventory, track sales, and verify product authenticity";
      case "consumer":
        return "Trace product origins, track sustainability, and verify authenticity";
      default:
        return "Welcome to your dashboard";
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRoleIcon()}
              <div>
                <CardTitle className="text-xl">{getRoleTitle()}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getRoleDescription()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {(role === "farmer" || role === "distributor") &&
                onRegisterProduct && (
                  <Button
                    onClick={onRegisterProduct}
                    data-testid="button-register-product"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Register Product
                  </Button>
                )}
              {(role === "farmer" || role !== "farmer") && onScanQR && (
                <Button
                  variant="outline"
                  onClick={onScanQR}
                  data-testid="button-scan-qr"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Role-specific Content */}
      {role === "farmer" && renderFarmerDashboard()}
      {role === "distributor" && renderDistributorDashboard()}
      {role === "retailer" && renderRetailerDashboard()}
      {role === "consumer" && renderConsumerDashboard()}
    </div>
  );
}
