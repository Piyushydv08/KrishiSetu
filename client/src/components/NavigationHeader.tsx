import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Bell, Sprout, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function NavigationHeader() {
  const [location, setLocation] = useLocation();
  const { user, firebaseUser, login, logout, loading } = useAuth();
  const [notificationCount] = useState(3);

  const isActiveRoute = (path: string) => location === path;

  if (loading) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center h-16 items-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user || !firebaseUser) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
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
            </div>
            <Button onClick={() => setLocation('/login')} data-testid="button-login">
              Sign In/Up
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
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
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-8">
                <Link href="/">
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute('/') 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`} data-testid="link-dashboard">
                    Dashboard
                  </a>
                </Link>
                <Link href="/qr-scanner">
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute('/qr-scanner') 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`} data-testid="link-scanner">
                    QR Scanner
                  </a>
                </Link>
                {["farmer", "distributor", "retailer"].includes(user.role) && (
                  <Link href="/registered-products">
                    <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute('/registered-products') 
                        ? 'text-primary border-b-2 border-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`} data-testid="link-registered-products">
                      Registered Products
                    </a>
                  </Link>
                )}
                {user.role === "consumer" && (
                  <Link href="/scanned-products">
                    <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute('/scanned-products') 
                        ? 'text-primary border-b-2 border-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`} data-testid="link-scanned-products">
                      Scanned Products
                    </a>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center" data-testid="text-notification-count">
                  {notificationCount}
                </span>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted" data-testid="button-user-menu">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={firebaseUser.photoURL || undefined} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-foreground" data-testid="text-user-name">{user.name}</div>
                    <div className="text-xs text-muted-foreground" data-testid="text-user-role">{user.role}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer" data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
