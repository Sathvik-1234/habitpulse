import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MonthlyStats } from './types';
import { Sidebar } from './components/Sidebar';
import { HabitGrid } from './components/HabitGrid';
import { VisualizationPanel } from './components/VisualizationPanel';
import { HabitDetail } from './components/HabitDetail';
import { Journal } from './components/Journal';
import { Settings } from './components/Settings';
import { AddHabitModal } from './components/AddHabitModal';
import { ConfirmModal } from './components/ConfirmModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { getProgressInsight } from './services/geminiService';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LocalProvider, useLocalContext } from './context/LocalContext';

const AppContent = () => {
  const { userName, habits, logs, addHabit, deleteHabit } = useLocalContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [view, setView] = useState('DASHBOARD');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  const [aiInsight, setAiInsight] = useState<{ message: string; tone: string } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Statistics Calculation
  const stats: MonthlyStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().getDate();
    const isCurrentMonth = month === new Date().getMonth() && year === new Date().getFullYear();
    const daysPassed = isCurrentMonth ? today : daysInMonth;

    let totalCompleted = 0;
    const totalPossible = habits.length * daysPassed;

    const dailyTrend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const completedCount = logs[dateStr]?.length || 0;
      if (day <= daysPassed) totalCompleted += completedCount;
      return { day, completed: completedCount, total: habits.length };
    });

    const habitPerformance = habits.map(habit => {
      let count = 0;
      for (let d = 1; d <= daysPassed; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (logs[dateStr]?.includes(habit.id)) count++;
      }
      return {
        id: habit.id,
        name: habit.name,
        count,
        rate: totalPossible > 0 ? (count / daysPassed) * 100 : 0
      };
    });

    return {
      totalPossible,
      totalCompleted,
      completionRate: totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0,
      dailyTrend,
      habitPerformance
    };
  }, [logs, habits, currentDate]);

  // AI Trigger
  const fetchInsight = useCallback(async () => {
    setLoadingAI(true);
    const result = await getProgressInsight(stats, currentDate);
    setAiInsight(result);
    setLoadingAI(false);
  }, [stats, currentDate]);

  useEffect(() => {
    // Only fetch insight if we have some data
    if (habits.length > 0) {
      const t = setTimeout(() => { if (!aiInsight) fetchInsight(); }, 2000);
      return () => clearTimeout(t);
    }
  }, [habits, logs]); 

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
    setAiInsight(null); 
  };

  const handleConfirmDeleteHabit = () => {
    if (habitToDelete) {
      deleteHabit(habitToDelete);
      if (selectedHabitId === habitToDelete) {
        setSelectedHabitId(null);
      }
      setHabitToDelete(null);
    }
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  // Flow Control
  if (!userName) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex h-screen bg-background text-slate-200 overflow-hidden font-sans">
      
      {/* 1. Sidebar */}
      <Sidebar currentView={view} onNavigate={setView} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header (Date Nav) */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-700 bg-surface/50 backdrop-blur-sm z-40 shrink-0">
           <h1 className="text-xl font-bold text-white tracking-wide">
             {view === 'DASHBOARD' ? `Welcome, ${userName}` : view === 'JOURNAL' ? 'Journal' : 'Settings'}
           </h1>
           
           {view === 'DASHBOARD' && (
             <div className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-1">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold w-32 text-center text-white">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white">
                  <ChevronRight size={18} />
                </button>
             </div>
           )}
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden p-6 relative">
          
          {view === 'DASHBOARD' ? (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
              
              {/* Left Column (70%): Active Zone - Habit List */}
              <div className="lg:col-span-7 h-full min-h-0 flex flex-col">
                <HabitGrid 
                  currentDate={currentDate}
                  selectedHabitId={selectedHabitId}
                  onAddHabit={() => setIsAddModalOpen(true)}
                  onSelectHabit={setSelectedHabitId}
                  onDeleteHabit={(id) => setHabitToDelete(id)}
                />
              </div>

              {/* Right Column (30%): Insight Zone - Analytics Widgets */}
              <div className="lg:col-span-3 h-full min-h-0">
                {selectedHabit ? (
                  <HabitDetail 
                    habit={selectedHabit}
                    logs={logs}
                    currentDate={currentDate}
                    onClose={() => setSelectedHabitId(null)}
                  />
                ) : (
                  <VisualizationPanel 
                    stats={stats}
                    habits={habits}
                    logs={logs}
                    currentDate={currentDate}
                    aiMessage={aiInsight?.message || null}
                    aiTone={aiInsight?.tone || 'neutral'}
                    loadingAI={loadingAI}
                    onRefreshAI={fetchInsight}
                  />
                )}
              </div>

            </div>
          ) : view === 'JOURNAL' ? (
            <Journal />
          ) : (
            <Settings />
          )}

          {/* Modals */}
          <AddHabitModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onAdd={addHabit} 
          />

          <ConfirmModal 
            isOpen={!!habitToDelete}
            title="Delete Habit?"
            message="This will permanently remove this habit and all its history. This action cannot be undone."
            onConfirm={handleConfirmDeleteHabit}
            onCancel={() => setHabitToDelete(null)}
          />

        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LocalProvider>
      <AppContent />
    </LocalProvider>
  );
}