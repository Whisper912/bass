/**
 * Bass Configuration and Constants
 * Standard tuning: E, A, D, G
 * Chromatic scale and C Major notes
 */

export const BASS_STRINGS = ['G', 'D', 'A', 'E']; // Top to bottom, matching bass tab order.
export const STRING_COLORS = ['#d1d5db', '#9ca3af', '#6b7280', '#4b5563'];
export const STRING_GAUGES: Record<string, number> = {
  'G': 1.5,
  'D': 2,
  'A': 2.5,
  'E': 3
};

export const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const C_MAJOR_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const STRING_OPEN_NOTES: Record<string, string> = {
  'G': 'G',
  'D': 'D',
  'A': 'A',
  'E': 'E'
};

export const getNoteAt = (string: string, fret: number): string => {
  const startIndex = CHROMATIC_SCALE.indexOf(STRING_OPEN_NOTES[string]);
  return CHROMATIC_SCALE[(startIndex + fret) % 12];
};

export const getFrequency = (string: string, fret: number): number => {
  // Standard tuning frequencies: E1 (41.20), A1 (55.00), D2 (73.42), G2 (98.00)
  const baseFreqs: Record<string, number> = {
    'E': 41.203,
    'A': 55.000,
    'D': 73.416,
    'G': 97.999
  };
  const base = baseFreqs[string];
  return base * Math.pow(2, fret / 12);
};

export const getLowestPositionForNote = (note: string): { string: string; fret: number } => {
  const positions: { string: string; fret: number; frequency: number }[] = [];

  BASS_STRINGS.forEach((string) => {
    for (let fret = 0; fret <= 12; fret += 1) {
      if (getNoteAt(string, fret) === note) {
        positions.push({ string, fret, frequency: getFrequency(string, fret) });
      }
    }
  });

  return positions.reduce((lowest, position) => (
    position.frequency < lowest.frequency ? position : lowest
  ), positions[0]);
};
