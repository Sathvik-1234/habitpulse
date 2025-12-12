export interface Habit {
  id: string;
  name: string;
  category: string;
}

// Map of date string (YYYY-MM-DD) to array of completed habit IDs
export interface HabitLogs {
  [date: string]: string[]; 
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