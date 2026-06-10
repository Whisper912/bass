import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BASS_STRINGS, STRING_GAUGES, getNoteAt, C_MAJOR_NOTES } from '../constants/bassConfig';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FretboardProps {
  showNotes: boolean;
  onFretClick: (string: string, fret: number) => void;
  feedback?: { string: string; fret: number; type: 'correct' | 'wrong' } | null;
  currentNote?: string;
  gameState?: string;
}

const NOTE_COLORS: Record<string, string> = {
  'C': 'bg-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]',
  'D': 'bg-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)]',
  'E': 'bg-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]',
  'F': 'bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
  'G': 'bg-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]',
  'A': 'bg-blue-600/40 shadow-[0_0_8px_rgba(37,99,235,0.2)]',
  'B': 'bg-fuchsia-500/40 shadow-[0_0_8px_rgba(217,70,239,0.2)]',
};

/**
 * Bass Fretboard Component
 * Displays 4 strings and 0-12 frets
 * Updated: 2023-11-23 16:00 (Fret range fix)
 */
export const Fretboard: React.FC<FretboardProps> = ({ 
  showNotes, 
  onFretClick, 
  feedback,
  currentNote,
  gameState
}) => {
  const frets = Array.from({ length: 13 }, (_, i) => i); // 0 to 12

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full bg-wood-dark rounded-md py-4 sm:py-6 px-2 sm:px-4 shadow-2xl border-y border-white/5 mx-auto max-w-full">
        <div className="relative flex w-full">
          {frets.map((fret) => (
            <div 
              key={fret} 
              className={cn(
                "relative flex flex-col flex-1 h-24 sm:h-36 md:h-48 border-r border-fret-silver/30 min-w-0",
                fret === 0 && "bg-black/40 border-r-[3px] sm:border-r-[6px] border-fret-gold/60 rounded-l-sm"
              )}
            >
              {/* Fret Markers */}
              {[3, 5, 7, 9, 12].includes(fret) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 sm:gap-12 pointer-events-none">
                  <div className="w-1.5 sm:w-3 h-1.5 sm:h-3 bg-white/10 rounded-full" />
                  {fret === 12 && <div className="w-1.5 sm:w-3 h-1.5 sm:h-3 bg-white/10 rounded-full" />}
                </div>
              )}

              {/* Fret Number */}
              <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 text-[8px] sm:text-xs text-muted-foreground/60 font-mono font-bold">
                {fret === 0 ? 'OPEN' : fret}
              </div>

              {/* Strings */}
              <div className="flex flex-col justify-between h-full py-2 z-10">
                {BASS_STRINGS.map((stringName) => {
                  const note = getNoteAt(stringName, fret);
                  const isFeedback = feedback?.string === stringName && feedback?.fret === fret;
                  const isCMajor = C_MAJOR_NOTES.includes(note);
                  
                  // Logic for flashing correct position
                  const shouldFlash = gameState === 'feedback' && 
                                    note === currentNote && 
                                    (feedback === null || feedback.type === 'wrong' || (feedback.type === 'correct' && !isFeedback));

                  return (
                    <div 
                      key={`${stringName}-${fret}`}
                      className="group relative flex-1 flex items-center justify-center cursor-pointer"
                      onClick={() => onFretClick(stringName, fret)}
                      aria-label={`${stringName} string fret ${fret}`}
                    >
                      {/* String Line */}
                      <div 
                        className="absolute w-full bg-gradient-to-b from-gray-400 to-gray-600 shadow-sm pointer-events-none" 
                        style={{ height: `${STRING_GAUGES[stringName]}px` }} 
                      />
                      
                      {/* Note Bubble */}
                      <div className={cn(
                        "z-20 w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[8px] sm:text-xs font-bold transition-all duration-300",
                        showNotes 
                          ? (isCMajor 
                              ? cn("opacity-100 scale-100 text-white/90 border border-white/10", NOTE_COLORS[note])
                              : "opacity-80 scale-90 bg-secondary/20 text-muted-foreground border border-white/5")
                          : "opacity-0 scale-0 bg-white/5",
                        isFeedback && feedback?.type === 'correct' && "opacity-100 scale-105 bg-green-600/80 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] !text-white",
                        isFeedback && feedback?.type === 'wrong' && "opacity-100 scale-105 bg-red-600/80 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] !text-white",
                        shouldFlash && "opacity-100 scale-105 bg-green-600/60 text-white animate-flash-correct z-30"
                      )}>
                        {note}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
