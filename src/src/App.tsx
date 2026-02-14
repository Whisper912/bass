import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Game } from './components/Game';
import { OrientationGuard } from './components/OrientationGuard';
import './global.css';

/**
 * App Entry Point
 * Sets up Tailwind config and Router
 */
window.tailwind.config = {
  ...window.tailwind.config,
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        wood: {
          dark: "hsl(var(--wood-dark))",
          light: "hsl(var(--wood-light))",
        },
        fret: {
          gold: "hsl(var(--fret-gold))",
          silver: "hsl(var(--fret-silver))",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <OrientationGuard />
      <div className="h-screen h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center overflow-hidden">
        <Routes>
          <Route path="/" element={<Game />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
