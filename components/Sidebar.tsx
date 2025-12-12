import React from 'react';
import { LayoutDashboard, BookOpen, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { logOut } = useAuth();
  
  const menuItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'JOURNAL', icon: BookOpen, label: 'Journal' },
    { id: 'SETTINGS', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-20 lg:w-64 bg-surface border-r border-slate-700 flex flex-col justify-between transition-all duration-300 h-full z-50">
      <div>
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-700 mb-4">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary to-accent rounded-lg flex-shrink-0"></div>
          <span className="ml-3 font-bold text-xl hidden lg:block tracking-tight">HabitPulse</span>
        </div>

        <nav className="px-2 lg:px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-blue-500/25' 
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
                }`}
              >
                <item.icon size={22} className={isActive ? 'text-white' : 'group-hover:text-white'} />
                <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={logOut}
          className="w-full flex items-center justify-center lg:justify-start p-2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <LogOut size={20} />
          <span className="ml-3 text-sm font-medium hidden lg:block">Sign Out</span>
        </button>
      </div>
    </div>
  );
};