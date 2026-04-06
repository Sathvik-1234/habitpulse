import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Square, Loader2, AlertCircle, Key } from 'lucide-react';
import { generateMusic } from '../services/gemini';
import { useLocalContext } from '../context/LocalContext';

// Add type declaration for window.aistudio
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const SystemRadio: React.FC = () => {
  const { playerStats } = useLocalContext();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasKey, setHasKey] = useState(true); // Assume true initially, check later
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!hasKey && window.aistudio?.openSelectKey) {
      handleSelectKey();
      return;
    }

    setLoading(true);
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);

    try {
      const prompt = `Generate a 30-second epic, motivational orchestral track for a player who is Level ${playerStats.level} with ${playerStats.str} Strength and ${playerStats.int} Intelligence. The mood should be intense and heroic, like a boss battle in a fantasy anime.`;
      const url = await generateMusic(prompt);
      setAudioUrl(url);
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
         setHasKey(false);
         setError("API Key not found or invalid. Please select a valid key.");
      } else {
         setError("Failed to generate track. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-700 p-6 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="text-accent" size={20} />
          System Radio
        </h2>
      </div>

      <div className="text-center py-4">
        <p className="text-slate-400 mb-4 text-sm">
          Generate an epic, personalized background track based on your current stats.
        </p>

        {!hasKey && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 mb-4 text-left">
            <p className="text-yellow-200 text-sm mb-3">
              Music generation requires a paid Gemini API key.
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline ml-1">Learn more about billing</a>.
            </p>
            <button
              onClick={handleSelectKey}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <Key size={16} /> Select API Key
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-200 text-sm text-left">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-4 text-slate-400">
            <Loader2 className="animate-spin mb-2 text-accent" size={24} />
            <p className="text-xs animate-pulse">Composing your epic track...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {!audioUrl ? (
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <Music size={18} />
                Generate BGM
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700 w-full max-w-xs">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-accent hover:bg-violet-600 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
                </button>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">Level {playerStats.level} Theme</p>
                  <p className="text-xs text-slate-400 truncate">System Generated</p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="text-xs text-slate-500 hover:text-white transition-colors"
                  title="Generate New Track"
                >
                  Regenerate
                </button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  autoPlay
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
