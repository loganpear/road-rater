import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, Play, Zap, Car, Shield, AlertTriangle } from 'lucide-react';

export function Hero() {
  const navigate = useNavigate();

  const handleHonk = () => {
    const audio = new Audio('/car-honk.mp3');
    audio.play();
  }


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Starfield / city lights effect */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Animated road perspective */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] overflow-hidden">
        {/* Road surface */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-full"
          style={{
            background: 'linear-gradient(to top, #1a1a2e 0%, transparent 100%)',
            transform: 'perspective(500px) rotateX(60deg) translateY(50%)',
            transformOrigin: 'center bottom',
          }}
        >
          {/* Road markings - center dashed line */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-full flex flex-col items-center gap-4 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-16 bg-primary/80 rounded-sm shrink-0 animate-road-line"
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          
          {/* Left lane marking */}
          <div className="w-2 h-16 bg-primary/80 rounded-sm shrink-0 animate-road-line shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
 />
          
          {/* Right lane marking */}
          <div className="w-2 h-16 bg-primary/80 rounded-sm shrink-0 animate-road-line shadow-[0_0_12px_hsl(var(--primary)/0.35)]" />
        </div>
      </div>

            {/* Animated cars on the road (up/down) */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden h-[60%]">
        {/* Car 1 - moving up (away) */}
        <div className="absolute left-1/2 -translate-x-1/2 animate-car-up">
          <div className="relative"  onClick={handleHonk}>
            <Car className="w-8 h-8 text-red-400" style={{ transform: 'rotate(270deg)' }} />
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-1 h-6 bg-red-500/40 blur-sm rounded-full" />
          </div>
        </div>

        {/* Car 2 - moving down (towards) */}
        <div className="absolute left-[44%] animate-car-down" style={{ animationDelay: '1.5s' }}>
          <div className="relative"  onClick={handleHonk}>
            <Car className="w-7 h-7 text-blue-400" style={{ transform: 'rotate(90deg)' }}/>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-1 h-6 bg-blue-500/40 blur-sm rounded-full" />
          </div>
        </div>

        {/* Car 3 - moving up slower */}
        <div className="absolute left-[56%] animate-car-up-slow" style={{ animationDelay: '3.5s' }}>
            <div className="relative" onClick={handleHonk}>
            <Car className="w-6 h-6 text-indigo-500" style={{ transform: 'rotate(270deg)' }} />
            </div>
        </div>
      </div>

      {/* Speed lines / motion blur effect */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-speed-line"
            style={{
              width: `${100 + Math.random() * 200}px`,
              top: `${40 + i * 8}%`,
              left: `${-20 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${1.5 + Math.random()}s`,
            }}
          />
        ))}
      </div>

      {/* Dashboard HUD elements */}
      <div className="absolute top-5 left-8 opacity-80 hidden lg:block animate-fade-in">
        <div className="flex items-center gap-2 text-primary/100 text-sm font-mono">
          <Shield className="w-4 h-4" />
          <span>SAFETY SYSTEM ACTIVE</span>
        </div>
      </div>
      
      <div className="absolute top-5 right-8 opacity-80 hidden lg:block animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center gap-2 text-amber-400/70 text-sm font-mono">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>RECORDING</span>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Gradient orbs for depth */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-8 animate-fade-in">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Analysis</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in text-white" style={{ animationDelay: '0.1s' }}>
            Drive Safer with{' '}
            <span className="text-gradient"><br/>Road-Rater AI</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Upload dashcam footage and receive a driving safety score with detailed feedback.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button
              size="lg"
              className="gradient-primary text-white font-semibold px-8 py-6 text-lg rounded-xl glow-primary hover:scale-105 transition-transform"
              onClick={() => navigate('/upload')}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Video
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary/50 text-white px-8 py-6 text-lg rounded-xl hover:bg-primary/10 transition-colors"
              onClick={() => navigate('/results/demo')}
            >
              <Play className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>

          {/* Stats with driving icons */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">5+</div>
              <div className="text-sm text-slate-400">Event Types Detected</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">100</div>
              <div className="text-sm text-slate-400">Point Scale</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">A-F</div>
              <div className="text-sm text-slate-400">Grade System</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
}
