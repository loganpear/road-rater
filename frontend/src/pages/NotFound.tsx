import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Car, Fuel, MapPinOff, Navigation, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const carJokes = [
  "Looks like you took a wrong turn at Albuquerque! 🗺️",
  "GPS recalculating... Page not found! 📍",
  "This page ran out of gas. We're sending a tow truck! ⛽",
  "You've hit a dead end. Time to reverse! 🔙",
  "Check engine light is on... for this URL! 🔧",
  "This road doesn't exist. Did you mean the highway? 🛣️",
  "404: Page took an unscheduled pit stop! 🏁",
  "Oops! This page is stuck in traffic somewhere... 🚗💨",
  "Your destination is in another castle... er, route! 🏰",
  "This URL has been revoked for reckless navigation! 🚨",
];

const NotFound = () => {
  const location = useLocation();
  const [joke, setJoke] = useState("");
  const [isHonking, setIsHonking] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    setJoke(carJokes[Math.floor(Math.random() * carJokes.length)]);
  }, [location.pathname]);

  const handleHonk = () => {
    setIsHonking(true);
    setTimeout(() => setIsHonking(false), 300);
    playHonkSound();
  };

  function playHonkSound() {
    const audio = new Audio('/car-honk.mp3');
    audio.play();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Animated road lines */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute h-2 w-20 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.sin(i) * 20}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6">
        {/* Big 404 with car */}
        <div className="relative mb-8">
          <h1 className="text-[12rem] md:text-[16rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 leading-none select-none">
            4
            <span className="relative inline-block">
              <Car 
                className={`inline-block w-24 h-24 md:w-32 md:h-32 text-blue-400 transition-transform cursor-pointer ${
                  isHonking ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={handleHonk}
              />
              {isHonking && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                  🔊 BEEP!
                </span>
              )}
            </span>
            4
          </h1>
        </div>

        {/* Joke */}
        <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <p className="text-xl md:text-2xl text-white font-medium">
            {joke}
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex justify-center gap-6 mb-8 text-slate-400">
          <div className="flex items-center gap-2">
            <MapPinOff className="w-5 h-5 text-red-400" />
            <span className="text-sm">Route: {location.pathname}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-400" />
            <span className="text-sm">Fuel: Empty</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8"
          >
            <Link to="/">
              <Home className="w-5 h-5 mr-2" />
              Return to Base
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <Link to="/upload">
              <Navigation className="w-5 h-5 mr-2" />
              New Destination
            </Link>
          </Button>
        </div>

        {/* Fun footer */}
        <p className="mt-12 text-slate-500 text-sm">
          Pro tip: Click the car to honk! 🚗
        </p>
      </div>
    </div>
  );
};

export default NotFound;
