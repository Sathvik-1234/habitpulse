import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const LogoutButton = () => {
  const { logOut } = useAuth();

  return (
    <button
      onClick={logOut}
      className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-500/50 rounded transition-all font-display tracking-widest text-xs uppercase"
      title="System Exit"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">System Exit</span>
    </button>
  );
};
