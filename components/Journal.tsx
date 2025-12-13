import React, { useState } from 'react';
import { Save, Calendar, Tag, Sparkles, Trophy, Trash2 } from 'lucide-react';
import { useLocalContext } from '../context/LocalContext';

const MOODS = [
  { label: 'Great', emoji: '😁', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
  { label: 'Good', emoji: '🙂', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { label: 'Okay', emoji: '😐', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  { label: 'Bad', emoji: '🙁', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  { label: 'Terrible', emoji: '😫', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
];

const TAGS = ['Busy', 'Sick', 'Travel', 'Rest Day', 'Energetic', 'Lazy', 'Focused'];

export const Journal: React.FC = () => {
  const { journalEntries, addJournalEntry, deleteJournalEntry, habits, logs } = useLocalContext();
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!mood) {
      alert("Please select a mood!");
      return;
    }
    
    addJournalEntry(mood, selectedTags, content, date);

    // Reset form partially
    setContent('');
    setMood('');
    setSelectedTags([]);
  };

  const isPerfectStreak = (dateStr: string) => {
    if (habits.length === 0) return false;
    const completedCount = logs[dateStr]?.length || 0;
    return completedCount === habits.length;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-2">
      
      {/* LEFT COLUMN: Input Zone */}
      <div className="lg:col-span-1 bg-surface rounded-3xl border border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="text-accent" size={20} />
          Daily Reflection
        </h2>

        {/* Date Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</label>
          <div className="relative">
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Mood Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mood</label>
          <div className="flex justify-between gap-1">
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => setMood(m.label)}
                className={`flex-1 p-2 rounded-xl border transition-all hover:scale-105 flex flex-col items-center gap-1 ${
                  mood === m.label 
                    ? m.color 
                    : 'bg-slate-800 border-slate-700 text-slate-500 opacity-60 hover:opacity-100'
                }`}
                title={m.label}
              >
                <span className="text-2xl">{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tag Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Context Tags</label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area - Enlarged */}
        <div className="flex flex-col gap-2 flex-1 min-h-[300px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highlight of the Day</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What went well today? What was challenging?"
            className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 focus:ring-2 focus:ring-primary outline-none resize-none placeholder:text-slate-600 leading-relaxed text-base"
          />
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Save Entry
        </button>
      </div>

      {/* RIGHT COLUMN: History Feed */}
      <div className="lg:col-span-2 flex flex-col h-full min-h-0">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 px-2">
          <Calendar size={20} className="text-slate-400" />
          Journal History
        </h2>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {journalEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 italic">
              <span className="text-4xl mb-4">📖</span>
              No entries yet. Start writing your first one!
            </div>
          ) : (
            journalEntries.map((entry) => {
              const moodConfig = MOODS.find(m => m.label === entry.mood);
              const perfect = isPerfectStreak(entry.date);
              
              return (
                <div key={entry.id} className="bg-surface rounded-2xl border border-slate-700 p-5 hover:border-slate-600 transition-colors group relative overflow-hidden">
                  {/* Perfect Streak Badge */}
                  {perfect && (
                    <div className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-bl-xl border-l border-b border-yellow-500/20 flex items-center gap-1.5 text-xs font-bold">
                      <Trophy size={12} />
                      Perfect Day
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-800 border border-slate-700 ${moodConfig?.color.replace('bg-', 'bg-opacity-10 ')}`}>
                        {moodConfig?.emoji}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        <div className="flex gap-2 text-xs text-slate-500">
                          {entry.mood}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(window.confirm("Delete this entry?")) deleteJournalEntry(entry.id);
                      }}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors z-10"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Content */}
                  <p className="text-slate-300 leading-relaxed mb-4 text-sm whitespace-pre-wrap">
                    {entry.content || <span className="italic text-slate-600">No details added.</span>}
                  </p>

                  {/* Footer Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700/50">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};