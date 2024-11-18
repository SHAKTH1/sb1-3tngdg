export interface Cell {
  letter: string;
  userInput: string;
  x: number;
  y: number;
  isActive: boolean;
  wordIndex: number;
  isRevealed: boolean;
}

export interface Word {
  word: string;
  clue: string;
  direction: 'across' | 'down';
  x: number;
  y: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  time: number;
  date: string;
}