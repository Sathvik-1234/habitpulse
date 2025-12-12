import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, Label
} from 'recharts';
import { Habit, HabitLogs } from '../types';
import { X, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';

interface HabitDetailProps {
  habit: Habit;
  logs: HabitLogs;
  currentDate: Date;
  onClose: () => void;
}

export const HabitDetail: React.FC<HabitDetailProps> = ({
  habit,
  logs,
  currentDate,
  onClose
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 1. Trend Line
  const trendData = useMemo(() => {
    const data = [];
    let cumulative = 0;
    const today = new Date().getDate();
    const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;
    const limitDay = isCurrentMonth ? today : daysInMonth;

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const done = logs[dateStr]?.includes(habit.id);
      if (i <= limitDay) {
        if (done) cumulative += 1;
        data.push({ day: i, actual: cumulative, ideal: i }); 
      }
    }
    return data;
  }, [habit, logs, year, month, daysInMonth]);

  // 2. Donut
  const donutData = useMemo(() => {
    const total = trendData.length; 
    const completed = trendData[total - 1]?.actual || 0;
    const missed = total - completed;
    return [
      { name: 'Completed', value: completed },
      { name: 'Missed', value: missed }
    ];
  }, [trendData]);

  // 3. Heatmap
  const heatmapGrid = useMemo(() => {
    const days = [];
    const firstDayOfWeek = new Date(year, month, 1).getDay(); 
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const done = logs[dateStr]?.includes(habit.id);
      const dayIndex = startOffset + (i - 1);
      const col = Math.floor(dayIndex / 7);
      const row = dayIndex % 7;
      days.push({ day: i, done, col, row });
    }
    return days;
  }, [year, month, daysInMonth, logs, habit]);

  return (
    <div className="bg-surface rounded-2xl border border-slate-700 h-full flex flex-col relative overflow-hidden animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white">{habit.name}</h2>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 w-fit mt-1 rounded bg-primary/20 text-primary tracking-wider">
            {habit.category}
          </span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        
        {/* Widget 1: Consistency (Donut) */}
        <div className="bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center relative shrink-0">
          <div className="absolute top-3 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={14} /> Consistency
          </div>
          <div className="w-full h-32 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                  <Cell fill="#3b82f6" />
                  <Cell fill="#334155" />
                  <Label value={`${donutData[0].value}/${donutData[0].value + donutData[1].value}`} position="center" className="fill-white text-sm font-bold" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 2: Trend Line */}
        <div className="bg-slate-900/50 rounded-xl p-4 flex flex-col relative shrink-0 h-48">
           <div className="absolute top-3 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} /> Growth
          </div>
          <div className="flex-1 mt-6 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" hide />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <ReferenceLine stroke="#475569" strokeDasharray="3 3" segment={[{ x: 1, y: 0 }, { x: trendData.length, y: trendData.length }]} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 3: Heatmap */}
        <div className="bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center relative shrink-0">
          <div className="absolute top-3 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={14} /> Daily Log
          </div>
          <div className="flex gap-2 items-center justify-center mt-8 mb-2">
            <div className="grid grid-rows-7 gap-1 text-[9px] text-slate-600 leading-none py-0.5">
               <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-1">
               {heatmapGrid.map((d) => (
                 <div 
                   key={d.day}
                   className={`w-4 h-4 rounded-[2px] transition-all hover:scale-125 ${d.done ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}
                   style={{ gridColumn: d.col + 1, gridRow: d.row + 1 }}
                   title={`Day ${d.day}`}
                 />
               ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};