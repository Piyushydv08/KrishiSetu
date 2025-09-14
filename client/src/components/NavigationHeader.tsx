import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Sprout, ChevronDown, LogOut, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function NavigationHeader() {
  const [location, setLocation] = useLocation();
  const { user, firebaseUser, login, logout, loading } = useAuth();
  const [notificationCount] = useState(3);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActiveRoute = (path: string) => location === path;

  if (loading) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center h-16 items-center">
            <div className="animate-pulse">FarmTrace...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user || !firebaseUser) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Flex container with wrapping */}
          <div className="flex flex-wrap justify-between items-center h-16 gap-2">
            {/* Left side: Logo + nav links */}
            <div className="flex flex-wrap items-center gap-4 flex-grow min-w-0">
              <div className="flex-shrink-0">
                <h1
                  className="text-2xl font-bold text-primary flex items-center gap-2 cursor-pointer hover:opacity-80"
                  onClick={() => setLocation("/")}
                  style={{ userSelect: "none" }}
                  data-testid="logo-home"
                >
                  <Sprout className="w-6 h-6" />
                  FarmTrace
                </h1>
              </div>

              {/* Desktop nav links - hide on small */}
              <div className="hidden md:flex space-x-4 min-w-0 flex-shrink">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute("/dashboard")
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  } truncate`}
                  data-testid="link-dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  href="/qr-scanner"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute("/qr-scanner")
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  } truncate`}
                  data-testid="link-scanner"
                >
                  QR Scanner
                </Link>
                <Link
                  href="/registered-products"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute("/registered-products")
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  } truncate`}
                  data-testid="link-registered-products"
                >
                  Registered Products
                </Link>
              </div>
            </div>

            {/* Right side: Sign In/Up button */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                onClick={() => setLocation("/login")}
                data-testid="button-login"
                className="whitespace-nowrap"
              >
                Sign In/Up
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Nav links for desktop and mobile
  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      show: true,
      testid: "link-dashboard",
    },
    {
      href: "/qr-scanner",
      label: "QR Scanner",
      show: true,
      testid: "link-scanner",
    },
    {
      href: "/registered-products",
      label: "Registered Products",
      show: ["farmer", "distributor", "retailer"].includes(user.role),
      testid: "link-registered-products",
    },
    {
      href: "/scanned-products",
      label: "Scanned Products",
      show: user.role === "consumer",
      testid: "link-scanned-products",
    },
    {
      href: "/request-products",
      label: "Request Product",
      show: user.role === "retailer" || user.role === "distributor",
      testid: "link-request-products",
    },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center h-16 gap-2">
          {/* Left: Logo + nav links */}
          <div className="flex flex-wrap items-center gap-4 flex-grow min-w-0">
            <div className="flex-shrink-0">
              <h1
                className="text-2xl font-bold text-primary flex items-center gap-2 cursor-pointer hover:opacity-80"
                onClick={() => setLocation("/")}
                style={{ userSelect: "none" }}
                data-testid="logo-home"
              >
                <Sprout className="w-6 h-6" />
                FarmTrace
              </h1>
            </div>
            {/* Desktop nav links */}
            <div className="hidden md:flex space-x-2 min-w-0 flex-shrink">
              {navLinks
                .filter((link) => link.show)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute(link.href)
                        ? "text-primary border-b-2 border-primary bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    } truncate`}
                    data-testid={link.testid}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          </div>

          {/* Right: Notifications, user menu, mobile toggle */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center"
                  data-testid="text-notification-count"
                >
                  {notificationCount}
                </span>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                  data-testid="button-user-menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={firebaseUser.photoURL || undefined}
                      alt={user.name}
                    />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left max-w-[120px] truncate">
                    <div
                      className="text-sm font-medium text-foreground truncate"
                      data-testid="text-user-name"
                      title={user.name}
                    >
                      {user.name}
                    </div>
                    <div
                      className="text-xs text-muted-foreground truncate"
                      data-testid="text-user-role"
                      title={user.role}
                    >
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/profile">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    data-testid="menu-profile"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer"
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 space-y-1 px-2 pb-3 border-t border-border">
            {navLinks
              .filter((link) => link.show)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActiveRoute(link.href)
                      ? "text-primary border-l-4 border-primary bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  data-testid={link.testid}
                >
                  {link.label}
                </Link>
              ))}
          </div>
        )}
      </div>
    </nav>
  );
}
