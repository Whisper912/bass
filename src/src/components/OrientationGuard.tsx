/**
 * OrientationGuard Component
 * Detects portrait orientation on mobile devices and prompts the user to rotate to landscape.
 * Essential for the fretboard game as it requires horizontal space.
 */
import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

export const OrientationGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Show guard only on smaller screens (mobile/tablet) and if it's portrait
      const isMobile = window.matchMedia("(max-width: 1024px)").matches;
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      setIsPortrait(isMobile && portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-4 border-primary/20 rounded-2xl flex items-center justify-center">
          <div className="w-16 h-8 border-2 border-primary rounded-md relative animate-bounce">
             <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-2 bg-primary rounded-r-sm" />
          </div>
        </div>
        <RotateCw className="absolute -bottom-2 -right-2 w-8 h-8 text-primary animate-spin-slow" style={{ animationDuration: '3s' }} />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">请旋转设备</h2>
      <p className="text-muted-foreground max-w-[280px]">
        为了获得最佳的练习体验，指板游戏需要横屏显示。
      </p>
      
      <div className="mt-8 flex gap-2 items-center text-xs text-primary/60 uppercase tracking-widest font-semibold">
        <div className="w-8 h-[1px] bg-primary/20" />
        Landscape Mode Required
        <div className="w-8 h-[1px] bg-primary/20" />
      </div>
    </div>
  );
};
