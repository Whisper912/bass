/**
 * Main Game Logic Component
 * Features: Fretboard recognition game, timer with pause, custom exit modal, and mobile-landscape optimization.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Volume2, Settings2, Pause, XCircle, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Fretboard } from './Fretboard';
import { useSound } from '../hooks/useSound';
import { useMobileLandscape } from '../hooks/useMobileLandscape';
import { C_MAJOR_NOTES, getNoteAt, getFrequency, getLowestPositionForNote } from '../constants/bassConfig';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type GameState = 'idle' | 'setup' | 'showingNote' | 'input' | 'feedback' | 'finished';

interface GameConfig {
  totalQuestions: number;
  timeLimit: number; // in ms
}

export const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [config, setConfig] = useState<GameConfig>({ totalQuestions: 10, timeLimit: 3000 });
  const [isPaused, setIsPaused] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timer, setTimer] = useState(3000);
  const timerValueRef = useRef(timer);
  const [feedback, setFeedback] = useState<{ string: string; fret: number; type: 'correct' | 'wrong' | 'timeout' } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [customQuestions, setCustomQuestions] = useState('10');
  const [customTime, setCustomTime] = useState('3');
  
  const { playNote, initAudio } = useSound();
  const isMobileLandscape = useMobileLandscape(); 
  const timerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync timer value to ref for pause/resume logic
  useEffect(() => {
    timerValueRef.current = timer;
  }, [timer]);

  const startRound = useCallback(() => {
    if (round >= config.totalQuestions) {
      setGameState('finished');
      return;
    }

    const randomNote = C_MAJOR_NOTES[Math.floor(Math.random() * C_MAJOR_NOTES.length)];
    setCurrentNote(randomNote);
    setGameState('showingNote');
    setFeedback(null);

    const pos = getLowestPositionForNote(randomNote);
    playNote(getFrequency(pos.string, pos.fret));

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      setGameState(prev => {
        if (prev === 'showingNote') return 'input';
        return prev;
      });
      startTimeRef.current = Date.now();
      setTimer(config.timeLimit);
      timerValueRef.current = config.timeLimit;
      transitionTimerRef.current = null;
    }, 1000);
  }, [round, playNote, config]);

  const handleTimeout = useCallback(() => {
    if (isPaused) return;
    setFeedback({ string: '', fret: -1, type: 'timeout' });
    setCombo(0);
    setGameState('feedback');
    
    if (round >= config.totalQuestions - 1) {
      setTimeout(() => setGameState('finished'), 1500);
    } else {
      setRound(r => r + 1);
      setTimeout(startRound, 1500);
    }
  }, [isPaused, config, round, startRound]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Main timer logic
  useEffect(() => {
    if (gameState === 'input' && !isPaused) {
      const timeSpent = config.timeLimit - timerValueRef.current;
      startTimeRef.current = Date.now() - timeSpent;

      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, config.timeLimit - elapsed);
        setTimer(remaining);
        if (remaining <= 0) {
          handleTimeout();
        }
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => { 
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      } 
    };
  }, [gameState, isPaused, config.timeLimit, handleTimeout]);

  const handleFretClick = (string: string, fret: number) => {
    if (gameState !== 'input' || isPaused) return;

    const clickedNote = getNoteAt(string, fret);
    playNote(getFrequency(string, fret));

    const isCorrect = clickedNote === currentNote;
    setFeedback({ string, fret, type: isCorrect ? 'correct' : 'wrong' });
    setGameState('feedback');
    
    if (isCorrect) {
      setScore(s => s + 1);
      setCombo(c => c + 1);
    } else {
      setCombo(0);
    }
    
    if (round >= config.totalQuestions - 1) {
      setTimeout(() => setGameState('finished'), 1500);
    } else {
      setRound(r => r + 1);
      setTimeout(startRound, 1500);
    }
  };

  const resetGame = () => {
    setRound(0);
    setScore(0);
    setCombo(0);
    setGameState('idle');
    setIsPaused(false);
    initAudio();
  };

  const togglePause = () => {
    if (gameState === 'idle' || gameState === 'finished') return;
    setIsPaused(!isPaused);
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    resetGame();
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
    setIsPaused(false);
  };

  const exitGame = () => {
    setIsPaused(true);
    setShowExitConfirm(true);
  };

  return (
    <div className={cn(
      "flex flex-col items-center w-full h-full max-w-7xl mx-auto overflow-hidden bg-background transition-all",
      isMobileLandscape ? "p-0" : "p-1 sm:p-2 md:p-4"
    )}>
      {/* Feedback Overlay */}
      {feedback && gameState === 'feedback' && (
        <div className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300",
            feedback.type === 'correct' ? "bg-green-500/20 animate-flash-screen-success" : "bg-red-500/20 animate-flash-screen-error"
          )} />
          
          <div className={cn(
            "relative flex flex-col items-center justify-center animate-bounce-in",
            feedback.type !== 'correct' && "animate-shake"
          )}>
            <div className={cn(
              "w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-2xl backdrop-blur-md border-4",
              feedback.type === 'correct' 
                ? "bg-green-500/90 text-white border-green-400 shadow-green-500/40" 
                : "bg-red-500/90 text-white border-red-400 shadow-red-500/40"
            )}>
              {feedback.type === 'correct' ? (
                <Check className="w-12 h-12 sm:w-16 sm:h-16 stroke-[4]" />
              ) : (
                <XCircle className="w-12 h-12 sm:w-16 sm:h-16 stroke-[4]" />
              )}
            </div>
            
            <div className="text-center space-y-1 sm:space-y-2">
              <h2 className={cn(
                "text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-lg",
                feedback.type === 'correct' ? "text-green-400" : "text-red-400"
              )}>
                {feedback.type === 'correct' ? 'Perfect!' : (feedback.type === 'timeout' ? 'Time Up!' : 'Oops!')}
              </h2>
              {feedback.type === 'correct' && combo > 1 && (
                <div className="animate-slide-up-fade">
                  <p className="text-lg sm:text-2xl font-black text-yellow-400 italic">{combo} COMBO</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && !showExitConfirm && (
        <div 
          onClick={togglePause}
          className="absolute inset-0 z-[150] bg-background/40 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-300"
        >
          <div className="group relative flex flex-col items-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-colors animate-pulse" />
            <div 
              className="relative w-28 h-28 md:w-40 md:h-40 rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center shadow-[0_0_50px_hsl(var(--primary)/0.3)] transition-transform group-hover:scale-110 active:scale-95"
            >
              <Play className="w-10 h-10 md:w-16 md:h-16 fill-current translate-x-1" />
              <span className="text-[10px] md:text-sm font-black mt-2 tracking-widest uppercase">Resume</span>
            </div>
            <p className="relative mt-6 text-xs md:text-base font-bold text-primary animate-pulse tracking-widest uppercase">Paused</p>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-background border border-border/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <XCircle size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">退出练习？</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed px-2">当前进度将不会被保存，<br/>确定要结束这次训练吗？</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleExitConfirm} className="w-full py-3.5 rounded-2xl bg-destructive text-destructive-foreground font-bold hover:opacity-90 active:scale-[0.98] transition-all">确定退出</button>
                <button onClick={handleExitCancel} className="w-full py-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 font-bold active:scale-[0.98] transition-all">继续练习</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn(
        "justify-between items-center w-full shrink-0 px-2 flex transition-all",
        isMobileLandscape ? "h-10 border-b border-border/10 bg-background/80 backdrop-blur-md z-10" : "py-1.5 sm:py-2"
      )}>
        {!isMobileLandscape ? (
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent leading-tight">Bass Fretboard Master</h1>
            <div className="flex items-center gap-2">
              <span className="text-[8px] sm:text-[10px] text-muted-foreground/40 font-medium tracking-widest ml-0.5">by 緑midori</span>
              {gameState !== 'idle' && gameState !== 'finished' && (
                <div className="flex items-center gap-2">
                  <button onClick={togglePause} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/50 hover:bg-secondary text-[8px] sm:text-xs font-medium transition-colors">
                    {isPaused ? <Play size={10} /> : <Pause size={10} />}
                    {isPaused ? '继续' : '暂停'}
                  </button>
                  <button onClick={exitGame} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/20 hover:bg-destructive/40 text-destructive text-[8px] sm:text-xs font-medium transition-colors">
                    <XCircle size={10} />退出
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full h-full">
            {gameState !== 'idle' && gameState !== 'finished' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={togglePause} className="flex items-center gap-1 px-2 h-7 rounded-md bg-secondary/30 hover:bg-secondary text-primary transition-all active:scale-90">
                  {isPaused ? <Play size={12} /> : <Pause size={12} />}
                  <span className="text-[9px] font-bold ml-1">{isPaused ? '继续' : '暂停'}</span>
                </button>
                <button onClick={exitGame} className="w-7 h-7 flex items-center justify-center rounded-md bg-destructive/10 hover:bg-destructive/30 text-destructive transition-all active:scale-90">
                  <XCircle size={14} />
                </button>
              </div>
            )}
            {(gameState === 'showingNote' || gameState === 'input' || gameState === 'feedback') ? (
              <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                <div className="flex items-center gap-2 px-2.5 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                  <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">Target</span>
                  <span className="text-base font-black text-primary animate-in zoom-in leading-none">{currentNote}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground bg-secondary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                  <span className="font-bold">{round + 1}/{config.totalQuestions}</span>
                  <div className="w-px h-2 bg-border/40" />
                  <span>Score: <span className="text-green-500 font-bold">{score}</span></span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-2 px-2 overflow-hidden">
                <span className="text-[10px] font-black tracking-widest text-muted-foreground/20 uppercase italic truncate">Bass Fretboard Master</span>
                <span className="text-[7px] text-muted-foreground/40 font-medium tracking-widest uppercase">by 緑midori</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn("flex items-center gap-2 bg-secondary/10 px-2 py-1.5 sm:p-2 rounded-lg border border-border/50 backdrop-blur-sm transition-colors", isMobileLandscape && "bg-transparent border-none p-0")}>
            <span className={cn("text-[8px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap", isMobileLandscape ? "text-[9px] font-bold mr-1" : "")}>{isMobileLandscape ? "HINT" : "显示提示"}</span>
            <button onClick={() => setShowNotes(!showNotes)} className={cn("w-7 h-3.5 sm:w-12 sm:h-6 rounded-full transition-colors relative", showNotes ? 'bg-primary' : 'bg-muted')}>
              <div className={cn("absolute top-0.5 w-2.5 h-2.5 sm:w-4 sm:h-4 bg-white rounded-full transition-all", showNotes ? (isMobileLandscape ? 'left-4' : 'left-7.5') : 'left-0.5')} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Display */}
      <div className={cn("flex-1 flex flex-col items-center justify-center w-full min-h-0 relative overflow-hidden", isMobileLandscape ? "my-0" : "my-1 sm:my-4")}>
        {gameState === 'idle' && (
          <div className={cn("flex flex-col items-center w-full animate-in fade-in zoom-in duration-500", isMobileLandscape ? "justify-center gap-2 h-full" : "justify-around h-full max-h-[600px]")}>
            <div className={cn("flex flex-col items-center justify-center", isMobileLandscape ? "gap-2" : "gap-6 md:gap-10")}>
              {!isMobileLandscape && (
                <div className="text-center space-y-2 md:space-y-4">
                  <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed px-4">通过听音辨位来熟悉 C 大调指板。<br/>挑战你的听力与反应速度！</p>
                </div>
              )}
              <button onClick={() => { initAudio(); startRound(); }} className={cn("group relative flex items-center justify-center bg-primary text-primary-foreground rounded-full font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_hsl(var(--primary)/0.2)] hover:shadow-primary/40 overflow-hidden", isMobileLandscape ? "w-24 h-24 text-base" : "w-40 h-40 md:w-52 md:h-52 text-xl md:text-2xl")}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={cn("flex flex-col items-center", isMobileLandscape ? "gap-0.5" : "gap-1 md:gap-2")}>
                  <Play className={cn("fill-current", isMobileLandscape ? "w-5 h-5" : "w-8 h-8 md:w-12 md:h-12")} />
                  <span>开始练习</span>
                </div>
              </button>
            </div>
            <div className={cn("w-full flex flex-col items-center", isMobileLandscape ? "gap-1" : "gap-2 md:gap-3")}>
              {!isMobileLandscape && <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold">当前训练配置</p>}
              <button onClick={() => setGameState('setup')} className={cn("group flex items-center bg-secondary/20 hover:bg-secondary/40 rounded-full border border-border/40 backdrop-blur-md transition-all hover:border-primary/40 hover:scale-105", isMobileLandscape ? "px-4 py-1.5 gap-2" : "px-6 md:px-8 py-3 md:py-4 gap-3 md:gap-4")}>
                <div className={cn("flex items-center gap-2 font-bold", isMobileLandscape ? "text-xs" : "text-sm")}><span className="text-primary">{config.totalQuestions}</span><span className="text-muted-foreground/60">{isMobileLandscape ? "题" : "题目"}</span></div>
                <div className="w-px h-3 bg-border/50" />
                <div className={cn("flex items-center gap-2 font-bold", isMobileLandscape ? "text-xs" : "text-sm")}><span className="text-primary">{config.timeLimit / 1000}s</span><span className="text-muted-foreground/60">限时</span></div>
                <div className="w-px h-3 bg-border/50" />
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors"><Settings2 className={isMobileLandscape ? "w-3 h-3" : "w-4 h-4"} /><span className={isMobileLandscape ? "text-[10px] font-bold" : "text-xs font-bold"}>{isMobileLandscape ? "设置" : "自定义"}</span></div>
              </button>
            </div>
          </div>
        )}

        {gameState === 'setup' && (
          <div className={cn("flex flex-col items-center w-full max-w-2xl bg-secondary/10 rounded-3xl border border-border/50 animate-in zoom-in duration-300 backdrop-blur-sm relative overflow-y-auto max-h-full", isMobileLandscape ? "p-4 gap-3" : "p-8 gap-8")}>
            <button onClick={() => setGameState('idle')} className={cn("absolute rounded-full hover:bg-secondary/50 transition-colors z-20", isMobileLandscape ? "top-2 right-2 p-1" : "top-6 right-6 p-2")}><XCircle className={isMobileLandscape ? "w-5 h-5 text-muted-foreground" : "w-6 h-6 text-muted-foreground"} /></button>
            <div className="text-center">
              <h2 className={cn("font-bold opacity-90", isMobileLandscape ? "text-xl" : "text-3xl")}>自定义配置</h2>
              {!isMobileLandscape && <p className="text-muted-foreground text-sm mt-1">调整你的训练难度</p>}
            </div>
            <div className={cn("w-full", isMobileLandscape ? "space-y-3" : "space-y-6")}>
              <div className={isMobileLandscape ? "space-y-2" : "space-y-4"}>
                <label className="text-[10px] sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><div className="w-1 h-3 sm:w-1.5 sm:h-4 bg-primary rounded-full" />题目数量</label>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[10, 20, 30].map(n => (
                    <button key={n} onClick={() => { setConfig({...config, totalQuestions: n}); setCustomQuestions(n.toString()); }} className={cn("rounded-xl border-2 transition-all font-bold", isMobileLandscape ? "py-1.5 text-xs" : "py-3", config.totalQuestions === n && (customQuestions === n.toString()) ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "border-border hover:border-primary/50 bg-background/50")}>{n}</button>
                  ))}
                  <div className={cn("relative flex items-center group transition-all duration-300 rounded-xl border-2 overflow-hidden", !['10','20','30'].includes(customQuestions) && customQuestions !== "" ? "border-primary/60 bg-primary/5 shadow-inner" : "border-dashed border-border hover:border-primary/40 bg-muted/20")}>
                    <input type="number" value={customQuestions} onChange={(e) => { const val = e.target.value; setCustomQuestions(val); const n = parseInt(val); if (!isNaN(n) && n > 0) setConfig({...config, totalQuestions: n}); }} className={cn("w-full h-full bg-transparent text-center font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60", isMobileLandscape ? "py-1.5 text-xs" : "py-3 px-3")} placeholder="自定义" />
                  </div>
                </div>
              </div>
              <div className={isMobileLandscape ? "space-y-2" : "space-y-4"}>
                <label className="text-[10px] sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><div className="w-1 h-3 sm:w-1.5 sm:h-4 bg-blue-500 rounded-full" />答题时限 (秒)</label>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[5, 3, 1].map(s => (
                    <button key={s} onClick={() => { setConfig({...config, timeLimit: s * 1000}); setCustomTime(s.toString()); }} className={cn("rounded-xl border-2 transition-all font-bold", isMobileLandscape ? "py-1.5 text-xs" : "py-3", config.timeLimit === s * 1000 && (customTime === s.toString()) ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "border-border hover:border-primary/50 bg-background/50")}>{s}s</button>
                  ))}
                  <div className={cn("relative flex items-center group transition-all duration-300 rounded-xl border-2 overflow-hidden", !['5','3','1'].includes(customTime) && customTime !== "" ? "border-primary/60 bg-primary/5 shadow-inner" : "border-dashed border-border hover:border-primary/40 bg-muted/20")}>
                    <input type="number" step="0.1" value={customTime} onChange={(e) => { const val = e.target.value; setCustomTime(val); const s = parseFloat(val); if (!isNaN(s) && s > 0) setConfig({...config, timeLimit: Math.round(s * 1000)}); }} className={cn("w-full h-full bg-transparent text-center font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60", isMobileLandscape ? "py-1.5 text-xs" : "py-3 px-3")} placeholder="自定义" />
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setGameState('idle')} className={cn("w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg", isMobileLandscape ? "py-2.5 text-base mt-2" : "py-4 text-lg mt-4")}>完成配置</button>
          </div>
        )}

        {(gameState === 'showingNote' || gameState === 'input' || gameState === 'feedback') && (
          <div className={cn("flex flex-col items-center justify-center w-full h-full animate-in fade-in slide-in-from-bottom-4 transition-all duration-300", isPaused && "opacity-30 pointer-events-none grayscale blur-sm", isMobileLandscape ? "gap-0" : "gap-0 sm:gap-4 md:gap-6")}>
            {!isMobileLandscape && (
              <div className="relative flex flex-col items-center shrink-0">
                <div className={cn("text-3xl sm:text-5xl md:text-9xl font-black tracking-tighter text-white drop-shadow-2xl transition-all duration-300", gameState === 'showingNote' ? "scale-110 blur-sm" : "scale-100 blur-0")}>{currentNote}</div>
                {gameState === 'showingNote' && <div className="absolute -bottom-2 sm:-bottom-6 text-primary text-[10px] sm:text-sm md:text-base font-bold animate-pulse">准备好了吗？</div>}
                {gameState === 'input' && (
                  <div className="absolute -bottom-1 sm:-bottom-4 left-0 w-full h-0.5 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-75 ease-linear" style={{ width: `${(timer / config.timeLimit) * 100}%` }} />
                  </div>
                )}
              </div>
            )}
            {isMobileLandscape && gameState === 'input' && (
              <div className="w-full h-1 bg-muted/20 shrink-0">
                <div className="h-full bg-primary transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(var(--primary),0.5)]" style={{ width: `${(timer / config.timeLimit) * 100}%` }} />
              </div>
            )}
            {!isMobileLandscape && (
              <div className="flex items-center gap-3 sm:gap-8 text-[10px] sm:text-lg md:text-xl font-mono text-muted-foreground shrink-0">
                <div className="flex items-center gap-1 sm:gap-2"><span className="text-primary font-bold">{round + 1}</span> / {config.totalQuestions}</div>
                <div className="flex items-center gap-1 sm:gap-2">得分: <span className="text-green-500 font-bold">{score}</span></div>
              </div>
            )}
            <div className={cn("transition-opacity duration-300 w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden", gameState === 'showingNote' ? 'opacity-0' : 'opacity-100')}>
              <div className={cn("w-full px-2 sm:px-8 py-0.5 sm:py-4 h-full flex items-center justify-center", isMobileLandscape && "py-0 px-1")}>
                <Fretboard showNotes={showNotes} onFretClick={handleFretClick} feedback={feedback} currentNote={currentNote} gameState={gameState} />
              </div>
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="flex flex-col items-center gap-8 animate-in zoom-in duration-500">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-2">训练完成!</h2>
              <p className="text-muted-foreground text-xl">你的最终得分</p>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative text-9xl font-black text-primary">{Math.round((score / config.totalQuestions) * 100)}%</div>
            </div>
            <div className="text-2xl font-medium text-muted-foreground">答对 {score} / {config.totalQuestions} 个音符</div>
            <button onClick={resetGame} className="flex items-center gap-3 bg-secondary text-secondary-foreground px-8 py-3 rounded-full text-lg font-semibold hover:bg-secondary/80 transition-all border border-border"><RotateCcw size={20} />再来一局</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn("mt-auto w-full text-xs text-muted-foreground/60 border-t border-border/30 shrink-0 transition-opacity hover:opacity-100 opacity-70", isMobileLandscape ? "pt-1 pb-1" : "pt-8")}>
        {isMobileLandscape ? (
          <div className="flex items-center justify-center gap-4 text-[8px] font-medium tracking-tight">
            <div className="flex items-center gap-1"><Volume2 size={10} className="text-primary/60" /><span>先听音再找谱</span></div>
            <div className="flex items-center gap-1"><Settings2 size={10} className="text-primary/60" /><span>0-12品音阶</span></div>
            <span className="text-muted-foreground/40 scale-90">by 緑midori</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-2"><Volume2 className="text-primary/60 shrink-0" size={14} /><p>先听音，再看谱。尝试在不看指板提示的情况下准确找到位置。</p></div>
            <div className="flex items-start gap-2"><Settings2 className="text-primary/60 shrink-0" size={14} /><p>标准四弦贝斯调音 (E A D G)，范围包含 0-12 品的所有同名音。</p></div>
            <div className="flex items-start gap-2"><div className="w-3 h-3 rounded-full bg-green-500/10 border border-green-500/30 shrink-0 mt-0.5" /><p>点击后，正确位置会显示绿色，错误则显示红色不得分。</p></div>
          </div>
        )}
      </div>
    </div>
  );
};
