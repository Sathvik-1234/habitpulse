import React, { useState } from 'react';
import { useLocalContext } from '../context/LocalContext';
import { Sparkles } from 'lucide-react';

export const WelcomeScreen = () => {
  const { setUserName } = useLocalContext();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setUserName(name.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background p-4">
      <div className="bg-surface p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-2xl mb-8 shadow-lg shadow-blue-500/20 flex items-center justify-center">
          <Sparkles className="text-white w-10 h-10" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-3">Welcome to HabitPulse</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Your personal offline-first habit tracker. <br/> Let's get started by setting up your profile.
        </p>
        
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-center text-lg focus:ring-2 focus:ring-primary outline-none mb-4 placeholder:text-slate-600 transition-all focus:border-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/25 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
};