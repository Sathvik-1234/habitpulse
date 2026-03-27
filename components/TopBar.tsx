import React from 'react';
import { useLocalContext } from '../context/LocalContext';
import { calculateRequiredXP } from '../lib/system';

export const TopBar: React.FC = () => {
  const { userName, playerStats } = useLocalContext();
  
  const xpForNextLevel = calculateRequiredXP(playerStats.level);
  const xpPercentage = Math.min(100, Math.max(0, (playerStats.xp / xpForNextLevel) * 100));

  return (
    <div className="flex items-center justify-between p-4 bg-background border-b border-border shrink-0">
      <div className="flex flex-col w-1/2 gap-2">
        <div className="flex items-center gap-4">
          <span className="text-white font-display text-xl tracking-wider">LVL : {playerStats.level}</span>
          <span className="text-yellow-400 font-display text-lg tracking-wider">GOLD : {playerStats.gold}</span>
        </div>

        {/* XP Bar */}
        <div className="flex items-center gap-2">
          <span className="text-primary font-display text-sm tracking-wider w-8">XP</span>
          <div className="h-2 flex-1 bg-surface border border-primary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <span className="text-primary font-display text-xs tracking-wider w-12 text-right">{Math.floor(xpPercentage)}%</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-white font-display text-2xl tracking-widest uppercase">{userName}</span>
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center relative overflow-hidden">
          {/* A simple flame/soul icon placeholder */}
          <div className="absolute inset-0 bg-red-500 opacity-50 blur-sm animate-pulse" />
          <div className="w-4 h-4 bg-red-400 rounded-full shadow-[0_0_10px_red]" />
        </div>
      </div>
    </div>
  );
};
