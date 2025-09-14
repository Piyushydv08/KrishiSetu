import { NavigationHeader } from "@/components/NavigationHeader";
import { StatsOverview } from "@/components/StatsOverview";
import { RecentProducts } from "@/components/RecentProducts";
import { QuickActionsPanel } from "@/components/QuickActionsPanel";
import { SupplyChainMap } from "@/components/SupplyChainMap";
import { ProductRegistrationForm } from "@/components/ProductRegistrationForm";
import { RoleSelection } from "@/components/RoleSelection";
import { RoleDashboard } from "@/components/RoleDashboard";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { QrCode, Plus } from "lucide-react";

export default function Dashboard() {
  const { user, loading, refreshUser } = useAuth();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [, navigate] = useLocation();

  // Check if user needs role selection
  useEffect(() => {
    if (user && !user.roleSelected) {
      setShowRoleSelection(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <NavigationHeader />
        <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            Loading dashboard...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Make Navbar sticky on top */}
      <NavigationHeader />

      {/* Add padding top to avoid content hidden behind sticky navbar */}
      <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based dashboard header (if role selected) */}
        {user?.roleSelected && (
          <div className="mb-8">
            <RoleDashboard
              user={user}
              onRegisterProduct={() => setShowRegistrationForm(true)}
              onScanQR={() => (window.location.href = "/qr-scanner")}
            />
          </div>
        )}

        {/* Quick Actions Header - Only show when user doesn't have role selected */}
        {!user?.roleSelected && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Supply Chain Dashboard
                </h2>
                <p className="text-muted-foreground mt-1">
                  Track, verify, and manage your product journey
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/qr-scanner">
                  <Button
                    className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2 shadow-sm"
                    data-testid="button-scan-qr"
                  >
                    <QrCode className="w-4 h-4" />
                    Scan QR Code
                  </Button>
                </Link>
                {user ? (
                  <Button
                    onClick={() => setShowRegistrationForm(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-sm"
                    data-testid="button-register-product"
                  >
                    <Plus className="w-4 h-4" />
                    Register Product
                  </Button>
                ) : (
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 text-foreground rounded-md px-3 py-2 text-sm flex items-center gap-1 shadow-sm border border-primary/20">
                    📝 Want to register a product? Log in first to continue.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview Cards */}
        <StatsOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Products Section */}
          <RecentProducts />

          {/* QR Scanner & Quick Actions */}
          <QuickActionsPanel />
        </div>

        {/* Supply Chain Map Section */}
        <div className="mt-8">
          <SupplyChainMap />
        </div>

        {/* Product Registration Form */}
        <ProductRegistrationForm
          isVisible={showRegistrationForm}
          onClose={() => {
            setShowRegistrationForm(false);
            window.scrollTo(0, 0);
          }}
        />

        {/* Role Selection Modal */}
        <RoleSelection
          isVisible={showRoleSelection}
          onRoleSelected={async () => {
            setShowRoleSelection(false);
            await refreshUser();
          }}
        />
      </main>
    </div>
  );
}
