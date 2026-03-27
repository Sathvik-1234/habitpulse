export interface Habit {
  id: string;
  name: string;
  category: string;
  goal?: number; // e.g., 11 for pushups
  unit?: string; // e.g., 'PUSHUPS'
}

// Map of date string (YYYY-MM-DD) to array of completed habit IDs
export interface HabitLogs {
  [date: string]: string[]; 
}

export interface PlayerStats {
  level: number;
  xp: number;
  gold: number;
  rank: string;
  playerClass: string;
  title: string;
  str: number;
  vit: number;
  agi: number;
  int: number;
  per: number;
  availablePoints: number;
  leaderboardPoints: number;
  physicalDamageReduction: number;
  magicalDamageReduction: number;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  perfectDaysTotal: number;
}

export interface DailyState {
  date: string;
  isPenaltyZone: boolean;
  allCompleted: boolean;
}

export interface MonthlyStats {
  totalPossible: number;
  totalCompleted: number;
  completionRate: number;
  dailyTrend: { day: number; completed: number; total: number }[];
  habitPerformance: { id: string; name: string; count: number; rate: number }[];
}

export enum AppView {
  TRACKER = 'TRACKER',
  REVIEW = 'REVIEW',
}

export interface AIInsightResponse {
  message: string;
  tone: 'encouraging' | 'warning' | 'celebratory';
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: 'Great' | 'Good' | 'Okay' | 'Bad' | 'Terrible';
  tags: string[];
  content: string;
}