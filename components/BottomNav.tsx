import React from 'react';
import { Swords, Axe, Hexagon, Flame, Shield } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'STATUS', icon: <Swords size={28} /> },
    { id: 'TASKS', icon: <Axe size={28} /> },
    { id: 'DASHBOARD', icon: <Hexagon size={28} /> },
    { id: 'JOURNAL', icon: <Flame size={28} /> },
    { id: 'SETTINGS', icon: <Shield size={28} /> },
  ];

  return (
    <div className="flex items-center justify-around p-4 bg-background border-t border-border shrink-0">
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative flex items-center justify-center w-14 h-14 transition-all duration-300 ${
              isActive ? 'text-white scale-110' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {/* Active indicator (diamond shape) */}
            {isActive && (
              <div className="absolute inset-0 border-2 border-white rotate-45 z-0" />
            )}
            
            {/* Hexagon background for all */}
            <div className="absolute inset-0 border border-slate-700 rotate-45 z-0 opacity-50" />
            
            <div className="z-10 relative">
              {item.icon}
            </div>
          </button>
        );
      })}
    </div>
  );
};
