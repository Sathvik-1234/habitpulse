import React, { useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Sparkles, Activity, PieChart as PieIcon } from 'lucide-react';
import { MonthlyStats, Habit, HabitLogs } from '../types';

interface VisualizationPanelProps {
  stats: MonthlyStats;
  habits: Habit[];
  logs: HabitLogs;
  currentDate: Date;
  aiMessage: string | null;
  aiTone: string;
  loadingAI: boolean;
  onRefreshAI: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#10b981', // emerald
  Growth: '#3b82f6', // blue
  Career: '#8b5cf6', // violet
  Mental: '#f59e0b', // amber
  General: '#64748b', // slate
};

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  stats,
  habits,
  logs,
  currentDate,
  aiMessage,
  aiTone,
  loadingAI,
}) => {
  const getToneColor = () => {
    switch (aiTone) {
      case 'warning': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'celebratory': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      default: return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    }
  };

  // 1. Radar Data (Life Balance)
  const radarData = useMemo(() => {
    const categories: Record<string, { total: number; completed: number }> = {};
    habits.forEach(h => {
      if (!categories[h.category]) categories[h.category] = { total: 0, completed: 0 };
    });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysPassed = new Date().getDate(); 

    habits.forEach(h => {
      categories[h.category].total += daysPassed;
      for (let d = 1; d <= daysPassed; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (logs[dateStr]?.includes(h.id)) categories[h.category].completed += 1;
      }
    });

    return Object.keys(categories).map(cat => ({
      subject: cat,
      A: categories[cat].total > 0 ? Math.round((categories[cat].completed / categories[cat].total) * 100) : 0,
      fullMark: 100
    }));
  }, [habits, logs, currentDate]);

  // 2. Bar Data (Volume)
  const volumeData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayEntry: any = { name: d.toLocaleDateString('en-US', { weekday: 'short' }) };
      Object.keys(CATEGORY_COLORS).forEach(c => dayEntry[c] = 0);
      const dayLogs = logs[dateStr] || [];
      dayLogs.forEach(habitId => {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          const cat = CATEGORY_COLORS[habit.category] ? habit.category : 'General';
          dayEntry[cat] = (dayEntry[cat] || 0) + 1;
        }
      });
      data.push(dayEntry);
    }
    return data;
  }, [logs, habits]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
      
      {/* 1. Daily Insight Widget */}
      <div className={`shrink-0 rounded-2xl border backdrop-blur-sm p-5 flex flex-col justify-center ${getToneColor()}`}>
        <div className="flex items-center gap-2 mb-2 text-current opacity-80">
          <Sparkles size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Daily Insight</h3>
        </div>
        <p className="text-sm font-medium leading-relaxed">
          {loadingAI ? <span className="animate-pulse">Analyzing patterns...</span> : aiMessage || "Start tracking to get insights!"}
        </p>
      </div>

      {/* 2. Life Balance Widget (Radar) */}
      <div className="shrink-0 bg-surface rounded-2xl border border-slate-700 p-4 flex flex-col relative overflow-hidden h-64">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <PieIcon size={14} /> Life Balance
        </div>
        <div className="flex-1 mt-4 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="55%" outerRadius="65%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.4} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. 7-Day Volume Widget (Bar) */}
      <div className="flex-1 min-h-[200px] bg-surface rounded-2xl border border-slate-700 p-4 flex flex-col relative">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Activity size={14} /> 7-Day Volume
        </div>
        <div className="flex-1 mt-6 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} margin={{ left: -20, right: 10, top: 10 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} cursor={{ fill: '#334155', opacity: 0.2 }} />
              {Object.keys(CATEGORY_COLORS).map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} radius={[2, 2, 2, 2]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};