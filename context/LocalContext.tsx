import React, { createContext, useContext, useEffect, useState } from 'react';
import { Habit, HabitLogs, JournalEntry } from '../types';

interface LocalContextType {
  userName: string;
  habits: Habit[];
  logs: HabitLogs;
  journalEntries: JournalEntry[];
  setUserName: (name: string) => void;
  addHabit: (name: string, category: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (habitId: string, dateStr: string) => void;
  addJournalEntry: (mood: string, tags: string[], content: string, date: string) => void;
  deleteJournalEntry: (id: string) => void;
  clearData: () => void;
}

const LocalContext = createContext<LocalContextType | undefined>(undefined);

export const useLocalContext = () => {
  const context = useContext(LocalContext);
  if (!context) {
    throw new Error('useLocalContext must be used within a LocalProvider');
  }
  return context;
};

const STORAGE_KEY = 'habitpulse_data_v1';

export const LocalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial State Load
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    return {
      userName: '',
      habits: [],
      logs: {},
      journalEntries: []
    };
  };

  const [data, setData] = useState(loadState());

  // Save on Change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setUserName = (name: string) => {
    setData(prev => ({ ...prev, userName: name }));
  };

  const addHabit = (name: string, category: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      category
    };
    setData(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
  };

  const deleteHabit = (id: string) => {
    setData(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      // Optional: Clean up logs for this habit if desired, keeping simple for now
    }));
  };

  const toggleHabit = (habitId: string, dateStr: string) => {
    setData(prev => {
      const currentDayLogs = prev.logs[dateStr] || [];
      const isCompleted = currentDayLogs.includes(habitId);
      
      let newDayLogs;
      if (isCompleted) {
        newDayLogs = currentDayLogs.filter(id => id !== habitId);
      } else {
        newDayLogs = [...currentDayLogs, habitId];
      }

      return {
        ...prev,
        logs: {
          ...prev.logs,
          [dateStr]: newDayLogs
        }
      };
    });
  };

  const addJournalEntry = (mood: string, tags: string[], content: string, date: string) => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date, // Using YYYY-MM-DD
      mood: mood as any,
      tags,
      content
    };
    setData(prev => ({
      ...prev,
      journalEntries: [newEntry, ...prev.journalEntries]
    }));
  };

  const deleteJournalEntry = (id: string) => {
    setData(prev => ({
      ...prev,
      journalEntries: prev.journalEntries.filter(e => e.id !== id)
    }));
  };

  const clearData = () => {
    if(window.confirm("Are you sure you want to reset all data?")) {
        localStorage.removeItem(STORAGE_KEY);
        setData({ userName: '', habits: [], logs: {}, journalEntries: [] });
    }
  };

  const value = {
    userName: data.userName,
    habits: data.habits,
    logs: data.logs,
    journalEntries: data.journalEntries,
    setUserName,
    addHabit,
    deleteHabit,
    toggleHabit,
    addJournalEntry,
    deleteJournalEntry,
    clearData
  };

  return (
    <LocalContext.Provider value={value}>
      {children}
    </LocalContext.Provider>
  );
};