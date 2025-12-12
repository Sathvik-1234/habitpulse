import React from 'react';

export const Settings = () => {
  return (
    <div className="h-full bg-surface rounded-2xl border border-slate-700 p-8 flex flex-col items-center justify-center text-slate-400">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">⚙️</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Settings</h2>
      <p>Configure notifications, themes, and account details.</p>
    </div>
  );
};