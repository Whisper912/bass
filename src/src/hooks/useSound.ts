import { useRef, useCallback } from 'react';

/**
 * Sound Engine Hook
 * Uses Web Audio API to synthesize bass-like sounds
 */
export function useSound() {
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  }, []);

  const playNote = useCallback((frequency: number, duration: number = 0.8) => {
    initAudio();
    if (!audioCtx.current) return;

    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Bass-like timbre: mix of sine and triangle or just a slightly filtered square
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    // Simple low pass filter to make it "thump" more like a bass
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, [initAudio]);

  return { playNote, initAudio };
}
