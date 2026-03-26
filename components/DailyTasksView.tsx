import React, { useState, useEffect } from 'react';
import { useLocalContext } from '../context/LocalContext';
import { Check, Info, AlertTriangle } from 'lucide-react';
import { getDailyQuests } from '../lib/system';

export const DailyTasksView: React.FC = () => {
  const { habits, logs, toggleHabit, playerStats, streakState, dailyState } = useLocalContext();
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time left until midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs[todayStr] || [];
  
  const systemQuests = getDailyQuests(playerStats.level);

  const getDynamicGoal = (habit: any, level: number) => {
    const name = habit.name.toLowerCase();
    if (name.includes('meditation')) {
      return Math.min(30, 5 + (level - 1) * 1);
    }
    if (name.includes('pushup') || name.includes('push-up')) {
      return 10 + (level - 1) * 5;
    }
    if (name.includes('run')) {
      return 1.0 + (level - 1) * 0.25;
    }
    return habit.goal || 1;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background text-slate-200 font-sans custom-scrollbar relative">
      
      {/* Background elements */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
        backgroundImage: dailyState.isPenaltyZone 
          ? 'radial-gradient(circle at 80% 20%, #FF4D4D 0%, transparent 40%)'
          : 'radial-gradient(circle at 80% 20%, #4D9FFF 0%, transparent 40%)'
      }} />

      {/* Header */}
      <div className="flex justify-between items-end mb-6 z-10">
        <div className="flex flex-col">
          <h1 className="text-5xl font-display font-bold text-white tracking-widest uppercase">Daily Tasks</h1>
          <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Complete to level up</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-primary flex flex-col items-center justify-center bg-surface relative">
            <span className="text-3xl font-display text-white leading-none">{streakState.currentStreak}</span>
            <span className="text-[10px] text-slate-400 tracking-widest uppercase leading-none mt-1">Streak</span>
            {/* Corner decorations */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary"></div>
          </div>
        </div>
      </div>

      {dailyState.isPenaltyZone && (
        <div className="bg-red-900/50 border border-red-500 p-4 flex items-center gap-4 z-10 relative animate-pulse">
          <AlertTriangle className="text-red-500 shrink-0" size={32} />
          <div>
            <h3 className="text-red-400 font-display text-xl tracking-widest uppercase">Penalty Zone Active</h3>
            <p className="text-red-200 text-sm">You failed to complete your daily quests. Complete them today or face a level down!</p>
          </div>
        </div>
      )}

      {/* Quest Info Box */}
      <div className="bg-surface/80 backdrop-blur border border-border p-6 flex flex-col gap-6 z-10 relative">
        <div className="flex items-center justify-center gap-2 border-b border-border pb-4">
          <Info size={20} className="text-white" />
          <h2 className="text-2xl font-display text-white tracking-widest uppercase">Quest Info</h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* System Quests */}
          {systemQuests.map(quest => {
            const isCompleted = todayLogs.includes(quest.id);
            const current = isCompleted ? quest.goal : 0;
            
            return (
              <div key={quest.id} className="flex items-center gap-4">
                <button
                  onClick={() => toggleHabit(quest.id, todayStr)}
                  className={`w-8 h-8 flex items-center justify-center border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-transparent border-slate-600 text-transparent hover:border-primary'
                  }`}
                >
                  <Check size={20} strokeWidth={3} />
                </button>
                <div className="flex-1 flex items-center">
                  <span className={`font-display text-2xl tracking-widest uppercase transition-colors ${
                    isCompleted ? 'text-slate-500 line-through' : 'text-blue-400'
                  }`}>
                    [SYSTEM] {quest.name} [{current}/{quest.goal} {quest.unit}]
                  </span>
                </div>
              </div>
            );
          })}

          {/* Custom Habits */}
          {habits.map(habit => {
            const isCompleted = todayLogs.includes(habit.id);
            const goal = getDynamicGoal(habit, playerStats.level);
            const current = isCompleted ? goal : 0;
            
            return (
              <div key={habit.id} className="flex items-center gap-4">
                <button
                  onClick={() => toggleHabit(habit.id, todayStr)}
                  className={`w-8 h-8 flex items-center justify-center border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-transparent border-slate-600 text-transparent hover:border-primary'
                  }`}
                >
                  <Check size={20} strokeWidth={3} />
                </button>
                <div className="flex-1 flex items-center">
                  <span className={`font-display text-2xl tracking-widest uppercase transition-colors ${
                    isCompleted ? 'text-slate-500 line-through' : 'text-white'
                  }`}>
                    {habit.name} [{current}/{goal} {habit.unit || ''}]
                  </span>
                </div>
              </div>
            );
          })}
          
          {habits.length === 0 && systemQuests.length === 0 && (
            <div className="text-center text-slate-500 font-display text-xl tracking-widest uppercase py-4">
              No quests available. Add some!
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="text-white font-display text-3xl tracking-widest">
            Timer: {timeLeft}
          </div>
          <div className="text-center">
            <p className="text-danger font-display text-lg tracking-widest uppercase leading-tight">
              Warning: Failure to complete the daily quest will
            </p>
            <p className="text-danger font-display text-lg tracking-widest uppercase leading-tight">
              result in an appropriate penalty
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
