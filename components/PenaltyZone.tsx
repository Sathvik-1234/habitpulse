import React, { useState } from 'react';
import { useLocalContext } from '../context/LocalContext';
import { getPenaltyQuests } from '../lib/system';
import { AlertTriangle, Skull } from 'lucide-react';

export const PenaltyZone: React.FC = () => {
  const { playerStats, resolvePenalty } = useLocalContext();
  const penaltyQuests = getPenaltyQuests(playerStats.level);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);

  const toggleQuest = (id: string) => {
    setCompletedQuests(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const allCompleted = completedQuests.length === penaltyQuests.length;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Glitchy Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_#ff0000_0%,_transparent_60%)] animate-pulse" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #f00 2px, #f00 4px)' }} />

      <div className="z-10 flex flex-col items-center max-w-md w-full gap-8">
        <div className="flex flex-col items-center gap-2 text-red-600 animate-bounce">
          <Skull size={64} strokeWidth={1.5} />
          <h1 className="text-5xl font-display font-bold tracking-widest uppercase text-center glitch-text" data-text="PENALTY ZONE">
            PENALTY ZONE
          </h1>
          <p className="text-red-500/80 tracking-widest uppercase text-sm text-center">
            You failed to complete your daily quests.
            <br/>Survive this to return to the system.
          </p>
        </div>

        <div className="w-full bg-red-950/30 border border-red-800/50 p-6 flex flex-col gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-red-800/50 pb-2 mb-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h2 className="text-xl font-display text-red-500 tracking-widest uppercase">Survival Quests</h2>
          </div>

          {penaltyQuests.map(quest => {
            const isCompleted = completedQuests.includes(quest.id);
            return (
              <button
                key={quest.id}
                onClick={() => toggleQuest(quest.id)}
                className={`flex items-center justify-between p-4 border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-red-900/40 border-red-500/50 text-red-300 opacity-50' 
                    : 'bg-black/50 border-red-800 hover:border-red-500 hover:bg-red-950/50 text-red-500'
                }`}
              >
                <span className="font-display tracking-widest uppercase text-lg">{quest.name}</span>
                <span className="font-display tracking-widest text-xl">{quest.goal} {quest.unit}</span>
              </button>
            );
          })}
        </div>

        <button
          disabled={!allCompleted}
          onClick={resolvePenalty}
          className={`w-full py-4 font-display text-2xl tracking-widest uppercase transition-all duration-500 ${
            allCompleted 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)]' 
              : 'bg-red-950/50 text-red-900 border border-red-900/50 cursor-not-allowed'
          }`}
        >
          {allCompleted ? 'I Survived' : 'Complete Quests to Unlock'}
        </button>
      </div>
      
      <style>{`
        .glitch-text {
          position: relative;
        }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -1px 0 red;
          clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: -1px 0 blue;
          clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
          0% { clip: rect(11px, 9999px, 88px, 0); }
          20% { clip: rect(61px, 9999px, 14px, 0); }
          40% { clip: rect(38px, 9999px, 66px, 0); }
          60% { clip: rect(92px, 9999px, 9px, 0); }
          80% { clip: rect(2px, 9999px, 83px, 0); }
          100% { clip: rect(79px, 9999px, 34px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip: rect(65px, 9999px, 100px, 0); }
          20% { clip: rect(3px, 9999px, 5px, 0); }
          40% { clip: rect(45px, 9999px, 82px, 0); }
          60% { clip: rect(12px, 9999px, 98px, 0); }
          80% { clip: rect(88px, 9999px, 22px, 0); }
          100% { clip: rect(31px, 9999px, 67px, 0); }
        }
      `}</style>
    </div>
  );
};
