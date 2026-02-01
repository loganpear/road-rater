import { Shield, Car } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="gradient-primary p-1.5 rounded-lg">
              <div className="relative">
                <Car className="h-4 w-4 text-white" />
                <Shield className="absolute -top-0.5 -right-0.5 h-2 w-2 text-white" />
              </div>
            </div>
            <span className="font-semibold text-gradient">Road-Rater AI</span>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            AI-powered driving safety analysis. Drive safer, score higher. Built for Spartahack XI
          </p>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Road-Rater AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
