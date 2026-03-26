import React, { useRef, useEffect } from 'react';
import { Check, Trash2, ChevronRight, Plus } from 'lucide-react';
import { useLocalContext } from '../context/LocalContext';
import { getDailyQuests } from '../lib/system';

interface HabitGridProps {
  currentDate: Date;
  selectedHabitId: string | null;
  onAddHabit: () => void;
  onSelectHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export const HabitGrid: React.FC<HabitGridProps> = ({
  currentDate,
  selectedHabitId,
  onAddHabit,
  onSelectHabit,
  onDeleteHabit
}) => {
  const { habits, logs, toggleHabit, playerStats } = useLocalContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate days in the month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Auto-scroll to today
  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date().getDate();
      const scrollPos = Math.max(0, (today - 4) * 60);
      scrollContainerRef.current.scrollLeft = scrollPos;
    }
  }, [currentDate]);

  const getDayLabel = (day: number) => {
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', { weekday: 'narrow' });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

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

  const systemQuests = getDailyQuests(playerStats.level);
  const allQuests = [...systemQuests, ...habits];

  return (
    <div className="flex flex-col h-full bg-surface rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
      {/* Header / Controls */}
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Habit Matrix</h2>
          <p className="text-slate-400 text-sm">Select a habit name for details</p>
        </div>
        <button
          onClick={onAddHabit}
          className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>New Habit</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sticky Left Column: Habit Names */}
        <div className="w-56 flex-shrink-0 bg-surface z-20 border-r border-slate-700 shadow-xl overflow-y-auto custom-scrollbar">
          <div className="h-12 border-b border-slate-700 bg-slate-800/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 font-semibold text-slate-300 shrink-0">
            Habit Name
          </div>
          {allQuests.map((habit) => {
            const isSystem = habit.id.startsWith('sys-');
            const goal = isSystem ? habit.goal : getDynamicGoal(habit, playerStats.level);
            return (
              <div
                key={habit.id}
                className={`h-14 border-b border-slate-700/50 flex items-center justify-between px-4 group transition-all cursor-pointer border-l-4 ${selectedHabitId === habit.id ? 'bg-slate-700/50 border-l-primary' : 'border-l-transparent hover:bg-slate-800'}`}
                onClick={() => !isSystem && onSelectHabit(habit.id)}
              >
                <div className="flex flex-col overflow-hidden max-w-[120px]">
                  <span className={`truncate text-sm font-medium ${selectedHabitId === habit.id ? 'text-white' : (isSystem ? 'text-blue-400' : 'text-slate-300')}`} title={habit.name}>
                    {isSystem ? `[SYS] ${habit.name}` : habit.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {habit.category} {goal > 1 ? `| ${goal} ${habit.unit || ''}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {!isSystem && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onDeleteHabit(habit.id); 
                      }}
                      className="opacity-50 hover:opacity-100 text-slate-500 hover:text-danger transition-all p-2 rounded-md hover:bg-slate-700 z-10"
                      title="Remove Habit"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {!isSystem && <ChevronRight size={14} className={`text-slate-600 ${selectedHabitId === habit.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />}
                </div>
              </div>
            );
          })}
          {allQuests.length === 0 && (
            <div className="p-6 text-sm text-slate-500 italic text-center">
              No habits yet.<br/>Click "New Habit" to start!
            </div>
          )}
        </div>

        {/* Scrollable Days Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar"
        >
          <div className="inline-block min-w-full">
            {/* Days Header */}
            <div className="flex sticky top-0 z-10">
              {daysArray.map((day) => (
                <div
                  key={day}
                  className={`w-12 h-12 flex-shrink-0 flex flex-col items-center justify-center border-b border-r border-slate-700/50 backdrop-blur-sm ${
                    isToday(day) ? 'bg-primary/20 text-primary border-b-primary/50' : 'bg-slate-800/90 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold">{getDayLabel(day)}</span>
                  <span className={`text-sm font-semibold ${isToday(day) ? 'text-white' : ''}`}>{day}</span>
                </div>
              ))}
            </div>

            {/* Checkboxes Grid */}
            <div>
              {allQuests.map((habit) => (
                <div key={habit.id} className="flex h-14 border-b border-slate-700/30">
                  {daysArray.map((day) => {
                    const dateStr = formatDate(day);
                    const isCompleted = logs[dateStr]?.includes(habit.id);
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(year, month, day);
                    
                    const isPast = checkDate < today;
                    const isFuture = checkDate > today;
                    const isTodayDate = checkDate.getTime() === today.getTime();

                    let buttonStyles = "w-6 h-6 rounded flex items-center justify-center transition-all duration-300 ";
                    
                    if (isPast) {
                      buttonStyles += "cursor-not-allowed ";
                      if (isCompleted) {
                        buttonStyles += "bg-slate-600 text-slate-400 opacity-60 scale-90";
                      } else {
                        buttonStyles += "bg-red-900/40 border border-red-800/50 text-transparent scale-75";
                      }
                    } else if (isFuture) {
                      buttonStyles += "cursor-not-allowed opacity-20 bg-slate-800 text-transparent scale-75";
                    } else {
                      // Today
                      buttonStyles += "cursor-pointer ";
                      if (isCompleted) {
                        buttonStyles += "bg-primary text-white scale-100 shadow-[0_0_15px_rgba(59,130,246,0.8)] hover:bg-blue-500";
                      } else {
                        buttonStyles += "bg-slate-700 text-transparent scale-85 hover:scale-100 hover:bg-slate-600 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]";
                      }
                    }

                    return (
                      <div
                        key={`${habit.id}-${day}`}
                        className={`w-12 h-full flex-shrink-0 flex items-center justify-center border-r border-slate-700/30 transition-colors ${
                          isCompleted ? 'bg-primary/5' : (isTodayDate ? 'bg-slate-800/30 hover:bg-slate-800/60' : '')
                        }`}
                      >
                        <button
                          disabled={!isTodayDate}
                          onClick={() => toggleHabit(habit.id, dateStr)}
                          className={buttonStyles}
                        >
                          <Check size={14} strokeWidth={4} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};