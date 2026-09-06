'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfrastructureIntroProps {
  onComplete?: () => void;
}

type TimeOfDay = 'sunrise' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'evening' | 'night' | 'mid-night';

interface SkyGradient {
  from: string;
  via: string;
  to: string;
  ambient: string;
}

const skyGradients: Record<TimeOfDay, SkyGradient> = {
  sunrise: {
    from: 'rgba(255, 94, 77, 0.3)',
    via: 'rgba(255, 154, 0, 0.2)',
    to: 'rgba(135, 206, 235, 0.4)',
    ambient: 'rgba(255, 154, 0, 0.05)'
  },
  morning: {
    from: 'rgba(135, 206, 235, 0.3)',
    via: 'rgba(255, 255, 255, 0.2)',
    to: 'rgba(135, 206, 250, 0.4)',
    ambient: 'rgba(135, 206, 235, 0.05)'
  },
  noon: {
    from: 'rgba(135, 206, 250, 0.3)',
    via: 'rgba(255, 255, 255, 0.3)',
    to: 'rgba(135, 206, 235, 0.3)',
    ambient: 'rgba(255, 255, 255, 0.08)'
  },
  afternoon: {
    from: 'rgba(135, 206, 235, 0.3)',
    via: 'rgba(255, 206, 84, 0.2)',
    to: 'rgba(255, 140, 0, 0.3)',
    ambient: 'rgba(255, 206, 84, 0.05)'
  },
  sunset: {
    from: 'rgba(255, 94, 77, 0.4)',
    via: 'rgba(255, 154, 0, 0.3)',
    to: 'rgba(75, 0, 130, 0.3)',
    ambient: 'rgba(255, 94, 77, 0.06)'
  },
  evening: {
    from: 'rgba(75, 0, 130, 0.3)',
    via: 'rgba(25, 25, 112, 0.3)',
    to: 'rgba(0, 0, 50, 0.4)',
    ambient: 'rgba(75, 0, 130, 0.04)'
  },
  night: {
    from: 'rgba(25, 25, 112, 0.4)',
    via: 'rgba(0, 0, 50, 0.3)',
    to: 'rgba(0, 0, 0, 0.8)',
    ambient: 'rgba(25, 25, 112, 0.03)'
  },
  'mid-night': {
    from: 'rgba(0, 0, 20, 0.6)',
    via: 'rgba(0, 0, 40, 0.4)',
    to: 'rgba(0, 0, 0, 0.9)',
    ambient: 'rgba(0, 0, 60, 0.02)'
  }
};

export default function InfrastructureIntro({ onComplete }: InfrastructureIntroProps) {
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Detect time of day
  useEffect(() => {
    const getTimeOfDay = (): TimeOfDay => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeInHours = hour + minute / 60;
      
      if (timeInHours >= 5 && timeInHours < 6) return 'sunrise'; // Dawn (5-6 AM)
      if (timeInHours >= 6 && timeInHours < 12) return 'morning'; // Morning (6 AM - 12 PM)
      if (timeInHours >= 12 && timeInHours < 14) return 'noon'; // Noon (12-2 PM)
      if (timeInHours >= 14 && timeInHours < 17) return 'afternoon'; // Afternoon (2-5 PM)
      if (timeInHours >= 17 && timeInHours < 18.5) return 'evening'; // Evening (5-6:30 PM)
      if (timeInHours >= 18.5 && timeInHours < 20) return 'sunset'; // Sunset (6:30-8 PM)
      if (timeInHours >= 20 && timeInHours < 24) return 'night'; // Night (8 PM - 12 AM)
      return 'mid-night'; // Late night (12-5 AM)
    };

    setTimeOfDay(getTimeOfDay());
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    let animationId: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // Phase 1: Background transition (0-2 seconds)
      if (elapsed < 2000) {
        // Kept for animation timing continuity.
      }
      
      // Phase 2: Subtitle appears (1.5-2.5 seconds)
      if (elapsed > 1500 && elapsed < 2500) {
        setSubtitleOpacity((elapsed - 1500) / 1000);
      } else if (elapsed >= 2500) {
        setSubtitleOpacity(0.7);
      }
      
      // Phase 3: Title appears (2.5-4.5 seconds)
      if (elapsed > 2500 && elapsed < 4500) {
        setTitleOpacity((elapsed - 2500) / 2000);
      } else if (elapsed >= 4500) {
        setTitleOpacity(1);
      }
      
      // Phase 4: Ambient breathing (only during active period, not continuous)
      if (elapsed > 2000 && elapsed < 5500) {
        // Kept for animation timing continuity.
      }
      
      // Complete animation after 5.5 seconds (allow title to be fully visible)
      if (elapsed > 5500 && !isFadingOut) {
        setIsFadingOut(true);
        onComplete?.();
        return;
      }
      
      // Stop animation loop after completion + fade
      if (elapsed < 7000) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [onComplete]);

  // Get current sky gradient
  const currentSky = skyGradients[timeOfDay];

  // Calculate background gradient based on progress and time of day
  const backgroundStyle = {
    background: `
      radial-gradient(
        ellipse at center,
        ${currentSky.from} 0%,
        ${currentSky.via} 40%,
        ${currentSky.to} 100%
      ),
      linear-gradient(
        180deg,
        ${currentSky.from} 0%,
        ${currentSky.to} 100%
      )
    `,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ 
          opacity: isFadingOut ? 0 : 1,
          scale: isFadingOut ? 1.3 : 1
        }}
        exit={{ opacity: 0, scale: 1.3 }}
        transition={{ 
          duration: 1.5, 
          ease: [0.4, 0, 0.2, 1] // Custom cubic bezier for smooth easing
        }}
        className="fixed inset-0 z-50 overflow-hidden"
        style={{
          ...backgroundStyle,
          transformOrigin: 'center center'
        }}
      >
        {/* Ambient atmospheric overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(
              ellipse at 30% 40%,
              ${currentSky.ambient} 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse at 70% 60%,
              ${currentSky.ambient} 0%,
              transparent 50%
            )`,
            filter: 'blur(40px)',
          }}
        />
        
        {/* Subtle moving haze - optimized */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            x: [0, 10, 0, -10, 0],
            y: [0, -5, 0, 5, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            type: "tween"
          }}
          style={{
            background: `radial-gradient(
              ellipse at center,
              ${currentSky.ambient} 0%,
              transparent 60%
            )`,
            filter: 'blur(50px)',
          }}
        />
        
        {/* Content container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Subtitle */}
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: subtitleOpacity, y: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="text-white text-sm md:text-base font-light tracking-widest mb-8"
            style={{
              fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
              textShadow: `0 0 20px ${currentSky.ambient}`,
              letterSpacing: '0.15em',
              fontWeight: 300,
            }}
          >
            Your day starts here.
          </motion.h3>
          
          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: titleOpacity, y: 0, scale: 1 }}
            transition={{ 
              duration: 2.5, 
              ease: "easeOut",
              delay: 0.3
            }}
            className="text-white font-light tracking-widest"
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 7rem)',
              fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
              textShadow: `0 0 60px ${currentSky.ambient}, 0 0 120px ${currentSky.ambient}`,
              letterSpacing: '0.15em',
              fontWeight: 300,
            }}
          >
            trakloop
          </motion.h1>
        </div>
        
        {/* Subtle lens diffusion overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.1) 100%)',
            filter: 'blur(2px)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
