"use client";

import { useEffect, useState } from "react";

// Fun loading messages that rotate
const loadingMessages = [
  "Getting things ready...",
  "Almost there...",
  "Loading your dashboard...",
  "Fetching the good stuff...",
  "One moment please...",
  "Preparing your workspace...",
];

interface LoadingScreenProps {
  message?: string;
  showMessage?: boolean;
}

export function LoadingScreen({ message, showMessage = true }: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(message || loadingMessages[0]);

  useEffect(() => {
    if (message) return; // Don't rotate if custom message provided
    
    const interval = setInterval(() => {
      setCurrentMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    }, 2500);

    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      {/* Wave animation container */}
      <div className="relative w-48 h-24 mb-8">
        {/* The wave SVG */}
        <svg
          viewBox="0 0 200 80"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background gradient for depth */}
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="foamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.8" />
              <stop offset="100%" stopColor="white" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Back wave (slower, lighter) */}
          <path
            className="animate-wave-back"
            fill="url(#waveGradient2)"
            d="M0,50 
               C20,45 40,55 60,50 
               C80,45 100,55 120,50 
               C140,45 160,55 180,50 
               C200,45 200,50 200,50
               L200,80 L0,80 Z"
          />
          
          {/* Main wave */}
          <path
            className="animate-wave-main"
            fill="url(#waveGradient)"
            d="M0,55 
               C30,40 50,65 80,50 
               C110,35 130,60 160,50 
               C190,40 200,55 200,55
               L200,80 L0,80 Z"
          />
          
          {/* Foam/spray particles */}
          <g className="animate-foam">
            <circle cx="70" cy="42" r="2" fill="url(#foamGradient)" className="animate-spray-1" />
            <circle cx="85" cy="38" r="1.5" fill="url(#foamGradient)" className="animate-spray-2" />
            <circle cx="75" cy="35" r="1" fill="url(#foamGradient)" className="animate-spray-3" />
            <circle cx="90" cy="40" r="1.5" fill="url(#foamGradient)" className="animate-spray-4" />
            <circle cx="65" cy="38" r="1" fill="url(#foamGradient)" className="animate-spray-5" />
          </g>
          
          {/* Front wave crest (foam line) */}
          <path
            className="animate-wave-crest"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeOpacity="0.6"
            strokeLinecap="round"
            d="M60,52 C75,42 85,48 95,45"
          />
        </svg>
        
        {/* Reflection/shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>

      {/* Loading text */}
      {showMessage && (
        <div className="text-center">
          <p className="text-lg font-medium text-foreground animate-fade-in">
            {currentMessage}
          </p>
          <div className="mt-3 flex justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce-dot-1" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce-dot-2" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce-dot-3" />
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline loading states
export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 40"
        className="w-16 h-8 text-primary"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="miniWaveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path
          className="animate-wave-mini"
          fill="url(#miniWaveGradient)"
          d="M0,25 
             C15,18 25,32 40,25 
             C55,18 65,32 80,25 
             C95,18 100,25 100,25
             L100,40 L0,40 Z"
        />
      </svg>
    </div>
  );
}
