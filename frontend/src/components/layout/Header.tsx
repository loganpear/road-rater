import { Link, useLocation } from 'react-router-dom';
import { Shield, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isHome ? 'bg-transparent' : 'bg-background/80 backdrop-blur-lg border-b border-border'
    )}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative gradient-primary p-2 rounded-lg">
              <div className="relative">
                <Car className="h-5 w-5 text-white" />
                <Shield className="absolute -top-1 -right-1 h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <span className="text-xl font-bold text-gradient">Road-Rater AI</span>
        </Link>

        <nav className="flex items-center gap-6">
        </nav>
      </div>
    </header>
  );
}
