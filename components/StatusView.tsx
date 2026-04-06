import React from 'react';
import { useLocalContext } from '../context/LocalContext';
import { Camera, Plus } from 'lucide-react';
import { SystemRadio } from './SystemRadio';

export const StatusView: React.FC = () => {
  const { userName, playerStats, allocateStat } = useLocalContext();

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background text-slate-200 font-sans custom-scrollbar">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-5xl font-display font-bold text-white tracking-widest uppercase">Status</h1>
          <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Your Stats and Rank</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-primary flex items-center justify-center bg-surface relative">
            <span className="text-4xl font-display text-white">{playerStats.rank}</span>
            {/* Corner decorations */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary"></div>
          </div>
          <p className="text-xs text-slate-400 tracking-widest uppercase mt-2">Rank</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-surface border border-border p-4 flex items-center gap-6 relative">
        <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
          <Camera className="text-slate-400" size={32} />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400 font-display text-xl tracking-widest uppercase w-16">Name:</span>
            <span className="text-white font-display text-2xl tracking-widest uppercase">{userName}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400 font-display text-xl tracking-widest uppercase w-16">Class:</span>
            <span className="text-white font-display text-2xl tracking-widest uppercase">{playerStats.playerClass}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400 font-display text-xl tracking-widest uppercase w-16">Title:</span>
            <span className="text-white font-display text-2xl tracking-widest uppercase">{playerStats.title}</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-6xl font-display font-bold text-white leading-none">{playerStats.level}</span>
          <span className="text-xs text-slate-400 tracking-widest uppercase">Level</span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-surface border border-border p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          {/* STR */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M14.5 17.5L3 6l4.5-4.5L19 13l-4.5 4.5zM13 19l6-6 4 4-6 6-4-4z"/></svg>
            </div>
            <span className="text-slate-400 font-display text-2xl tracking-widest uppercase w-12">STR:</span>
            <span className="text-white font-display text-2xl tracking-widest w-8">{playerStats.str}</span>
            {playerStats.availablePoints > 0 && (
              <button onClick={() => allocateStat('str')} className="w-5 h-5 bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center rounded-sm transition-colors border border-primary/30">
                <Plus size={14} />
              </button>
            )}
          </div>
          {/* VIT */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <span className="text-slate-400 font-display text-2xl tracking-widest uppercase w-12">VIT:</span>
            <span className="text-white font-display text-2xl tracking-widest w-8">{playerStats.vit}</span>
            {playerStats.availablePoints > 0 && (
              <button onClick={() => allocateStat('vit')} className="w-5 h-5 bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center rounded-sm transition-colors border border-primary/30">
                <Plus size={14} />
              </button>
            )}
          </div>
          {/* AGI */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="text-slate-400 font-display text-2xl tracking-widest uppercase w-12">AGI:</span>
            <span className="text-white font-display text-2xl tracking-widest w-8">{playerStats.agi}</span>
            {playerStats.availablePoints > 0 && (
              <button onClick={() => allocateStat('agi')} className="w-5 h-5 bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center rounded-sm transition-colors border border-primary/30">
                <Plus size={14} />
              </button>
            )}
          </div>
          {/* INT */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2"/></svg>
            </div>
            <span className="text-slate-400 font-display text-2xl tracking-widest uppercase w-12">INT:</span>
            <span className="text-white font-display text-2xl tracking-widest w-8">{playerStats.int}</span>
            {playerStats.availablePoints > 0 && (
              <button onClick={() => allocateStat('int')} className="w-5 h-5 bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center rounded-sm transition-colors border border-primary/30">
                <Plus size={14} />
              </button>
            )}
          </div>
          {/* PER */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <span className="text-slate-400 font-display text-2xl tracking-widest uppercase w-12">PER:</span>
            <span className="text-white font-display text-2xl tracking-widest w-8">{playerStats.per}</span>
            {playerStats.availablePoints > 0 && (
              <button onClick={() => allocateStat('per')} className="w-5 h-5 bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center rounded-sm transition-colors border border-primary/30">
                <Plus size={14} />
              </button>
            )}
          </div>
          
          {/* Available Points */}
          <div className="flex items-center justify-end gap-2 col-start-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 tracking-widest uppercase leading-tight">Available</span>
              <span className="text-[10px] text-slate-400 tracking-widest uppercase leading-tight">Ability</span>
              <span className="text-[10px] text-slate-400 tracking-widest uppercase leading-tight">Points</span>
            </div>
            <span className={`font-display text-4xl leading-none ${playerStats.availablePoints > 0 ? 'text-primary animate-pulse' : 'text-white'}`}>
              {playerStats.availablePoints}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-surface border border-border p-4 flex flex-col gap-2 relative">
        <div className="flex items-center gap-2">
          <span className="text-white font-display text-xl tracking-widest uppercase">Leaderboard Points:</span>
          <span className="text-white font-display text-xl tracking-widest">{playerStats.leaderboardPoints}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-display text-xl tracking-widest uppercase">Physical Damage Reduction:</span>
          <span className="text-white font-display text-xl tracking-widest">{playerStats.physicalDamageReduction}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-display text-xl tracking-widest uppercase">Magical Damage Reduction:</span>
          <span className="text-white font-display text-xl tracking-widest">{playerStats.magicalDamageReduction}%</span>
        </div>
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 border-2 border-primary flex items-center justify-center bg-surface rotate-45">
          <div className="-rotate-45 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><path d="M14.5 17.5L3 6l4.5-4.5L19 13l-4.5 4.5zM13 19l6-6 4 4-6 6-4-4z"/></svg>
          </div>
        </div>
      </div>

      {/* System Radio */}
      <SystemRadio />

    </div>
  );
};
