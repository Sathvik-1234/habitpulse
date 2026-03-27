import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MonthlyStats } from './types';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { StatusView } from './components/StatusView';
import { DailyTasksView } from './components/DailyTasksView';
import { HabitGrid } from './components/HabitGrid';
import { VisualizationPanel } from './components/VisualizationPanel';
import { HabitDetail } from './components/HabitDetail';
import { Journal } from './components/Journal';
import { SyncSettings } from './components/SyncSettings';
import { AddHabitModal } from './components/AddHabitModal';
import { ConfirmModal } from './components/ConfirmModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PenaltyZone } from './components/PenaltyZone';
import { LoginPage } from './components/LoginPage';
import { NewPlayerRegistration } from './components/NewPlayerRegistration';
import { getProgressInsight } from './services/geminiService';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LocalProvider, useLocalContext } from './context/LocalContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent = () => {
  const { currentUser } = useAuth();
  const { userName, habits, logs, addHabit, deleteHabit, dailyState, loadingData, isNewUser } = useLocalContext();
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
  if (!currentUser) {
    return <LoginPage />;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-blue-500 font-display tracking-widest uppercase animate-pulse">Syncing with System...</p>
        </div>
      </div>
    );
  }

  if (isNewUser) {
    return <NewPlayerRegistration />;
  }

  if (!userName) {
    return <WelcomeScreen />;
  }

  if (dailyState.isPenaltyZone) {
    return <PenaltyZone />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-slate-200 overflow-hidden font-sans">
      
      {/* Top Bar (Level, Name) */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {view === 'STATUS' && <StatusView />}
        {view === 'TASKS' && <DailyTasksView />}
        
        {view === 'DASHBOARD' && (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
             <header className="h-16 flex items-center justify-between px-4 border-b border-slate-700 bg-surface/50 backdrop-blur-sm shrink-0 mb-4">
               <h1 className="text-xl font-bold text-white tracking-wide">
                 Dashboard
               </h1>
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
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
              <div className="lg:col-span-7 h-full min-h-0 flex flex-col">
                <HabitGrid 
                  currentDate={currentDate}
                  selectedHabitId={selectedHabitId}
                  onAddHabit={() => setIsAddModalOpen(true)}
                  onSelectHabit={setSelectedHabitId}
                  onDeleteHabit={(id) => setHabitToDelete(id)}
                />
              </div>
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
          </div>
        )}
        
        {view === 'JOURNAL' && <Journal />}
        {view === 'SETTINGS' && <SyncSettings />}

      </div>

      {/* Bottom Navigation */}
      <BottomNav currentView={view} onNavigate={setView} />

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
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LocalProvider>
        <AppContent />
      </LocalProvider>
    </AuthProvider>
  );
}