import React, { useState } from 'react';
import { useLocalContext } from '../context/LocalContext';
import { Loader2, Terminal } from 'lucide-react';

export const NewPlayerRegistration = () => {
  const { registerUser } = useLocalContext();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Designation cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await registerUser(name.trim());
    } catch (err) {
      setError('Failed to register. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_transparent_60%)] animate-pulse" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #1e3a8a 2px, #1e3a8a 4px)' }} />

      <div className="bg-slate-950/90 p-10 border border-blue-900/50 flex flex-col items-center max-w-lg w-full z-10 backdrop-blur-md shadow-[0_0_40px_rgba(30,58,138,0.4)]">
        <div className="flex items-center gap-3 mb-8 w-full border-b border-blue-900/50 pb-4">
          <Terminal className="text-blue-500" size={28} />
          <h1 className="text-2xl font-display font-bold text-white tracking-widest uppercase">
            System Initialization
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-blue-400 font-display tracking-widest uppercase text-sm flex items-center gap-2">
              <span className="animate-pulse">_</span> [SYSTEM] ENTER PLAYER DESIGNATION:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/50 border border-blue-800 focus:border-blue-500 outline-none px-4 py-3 text-white font-display text-xl tracking-wider uppercase shadow-[inset_0_0_10px_rgba(30,58,138,0.2)] transition-colors"
              placeholder="e.g. SATHVIK"
              autoFocus
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-red-500 font-display text-sm tracking-wider uppercase">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 mt-4 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 hover:text-white border border-blue-700 hover:border-blue-400 font-display text-lg tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(30,58,138,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
            {isSubmitting ? 'REGISTERING...' : 'AWAKEN'}
          </button>
        </form>
      </div>
    </div>
  );
};
