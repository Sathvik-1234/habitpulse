import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useLocalContext } from '../context/LocalContext';
import { getAiInsights } from '../services/gemini';

export const AiInsights: React.FC = () => {
  const { habits, journalEntries } = useLocalContext();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const result = await getAiInsights(habits, journalEntries);
      setInsight(result);
    } catch (err) {
      console.error(err);
      setError("Check your API Key or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-700 p-6 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="text-accent" size={20} />
          AI Coach
        </h2>
      </div>

      {!insight && !loading && !error && (
        <div className="text-center py-6">
          <p className="text-slate-400 mb-4 text-sm">
            Get personalized advice based on your habits and journal entries.
          </p>
          <button
            onClick={handleGenerate}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent hover:from-blue-600 hover:to-violet-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 mx-auto"
          >
            <Sparkles size={18} />
            Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Loader2 className="animate-spin mb-3 text-primary" size={32} />
          <p className="text-sm animate-pulse">Analyzing your progress...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-200">
          <AlertCircle size={20} />
          <div className="flex flex-col items-start">
             <span className="text-sm font-bold">Error</span>
             <span className="text-xs">{error}</span>
          </div>
        </div>
      )}

      {insight && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
            <p className="text-slate-200 whitespace-pre-line leading-relaxed text-sm">
              {insight}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="mt-4 text-xs text-slate-500 hover:text-primary transition-colors flex items-center gap-1 mx-auto"
          >
            <Sparkles size={12} /> Refresh Advice
          </button>
        </div>
      )}
    </div>
  );
};