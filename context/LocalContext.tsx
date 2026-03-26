import React, { createContext, useContext, useEffect, useState } from 'react';
import { Habit, HabitLogs, JournalEntry, PlayerStats, StreakState, DailyState } from '../types';
import { getDailyQuests, calculateRequiredXP } from '../lib/system';

interface LocalContextType {
  userName: string;
  playerStats: PlayerStats;
  streakState: StreakState;
  dailyState: DailyState;
  habits: Habit[];
  logs: HabitLogs;
  journalEntries: JournalEntry[];
  setUserName: (name: string) => void;
  addHabit: (name: string, category: string, goal?: number, unit?: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (habitId: string, dateStr: string) => void;
  addJournalEntry: (mood: string, tags: string[], content: string, date: string) => void;
  deleteJournalEntry: (id: string) => void;
  clearData: () => void;
  getSyncCode: () => string;
  importSyncCode: (code: string) => boolean;
  allocateStat: (stat: 'str' | 'vit' | 'agi' | 'int') => void;
  resolvePenalty: () => void;
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
        const parsed = JSON.parse(saved);
        // Ensure new fields exist for backward compatibility
        if (!parsed.playerStats.hp) parsed.playerStats.hp = 100 + (parsed.playerStats.vit || 10) * 10;
        if (!parsed.playerStats.maxHp) parsed.playerStats.maxHp = 100 + (parsed.playerStats.vit || 10) * 10;
        if (parsed.playerStats.gold === undefined) parsed.playerStats.gold = 0;
        if (!parsed.streakState) parsed.streakState = { currentStreak: 0, longestStreak: 0, perfectDaysTotal: 0 };
        if (!parsed.dailyState) parsed.dailyState = { date: new Date().toISOString().split('T')[0], isPenaltyZone: false, allCompleted: false };
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    return {
      userName: '',
      playerStats: {
        level: 1,
        xp: 0,
        gold: 0,
        hp: 200,
        maxHp: 200,
        rank: 'E',
        playerClass: 'ASSASSIN',
        title: 'WOLF SLAYER',
        str: 10,
        vit: 10,
        agi: 10,
        int: 10,
        per: 10,
        availablePoints: 0,
        leaderboardPoints: 0,
        physicalDamageReduction: 5,
        magicalDamageReduction: 4,
      },
      streakState: {
        currentStreak: 0,
        longestStreak: 0,
        perfectDaysTotal: 0
      },
      dailyState: {
        date: new Date().toISOString().split('T')[0],
        isPenaltyZone: false,
        allCompleted: false
      },
      habits: [],
      logs: {},
      journalEntries: []
    };
  };

  const [data, setData] = useState(loadState());

  // Midnight Check & Penalty Logic
  useEffect(() => {
    const checkMidnight = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      
      setData(prev => {
        if (prev.dailyState.date !== todayStr) {
          // A new day has started. Check yesterday's completion.
          const yesterdayStr = prev.dailyState.date;
          const yesterdayLogs = prev.logs[yesterdayStr] || [];
          
          const systemQuests = getDailyQuests(prev.playerStats.level);
          const allSystemCompleted = systemQuests.every(q => yesterdayLogs.includes(q.id));
          const allCustomCompleted = prev.habits.every(h => yesterdayLogs.includes(h.id));
          const allCompletedYesterday = allSystemCompleted && allCustomCompleted;
          
          let newStreakState = { ...prev.streakState };
          let newPlayerStats = { ...prev.playerStats };
          let newDailyState = { date: todayStr, isPenaltyZone: false, allCompleted: false };

          if (allCompletedYesterday) {
            newStreakState.currentStreak += 1;
            newStreakState.longestStreak = Math.max(newStreakState.longestStreak, newStreakState.currentStreak);
            newStreakState.perfectDaysTotal += 1;
          } else {
            // Failed to complete all quests
            newStreakState.currentStreak = 0;
            
            if (prev.dailyState.isPenaltyZone) {
              // Failed Penalty Zone -> Level Down
              newPlayerStats.level = Math.max(1, newPlayerStats.level - 1);
              newPlayerStats.xp = 0;
              newPlayerStats.hp = newPlayerStats.maxHp;
              newDailyState.isPenaltyZone = false; // Reset penalty zone after level down
            } else {
              // Failed normal day -> Enter Penalty Zone & Lose HP
              newPlayerStats.hp = Math.max(1, newPlayerStats.hp - 10);
              newDailyState.isPenaltyZone = true;
            }
          }

          return {
            ...prev,
            playerStats: newPlayerStats,
            streakState: newStreakState,
            dailyState: newDailyState
          };
        }
        return prev;
      });
    };

    checkMidnight();
    const interval = setInterval(checkMidnight, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Reminder Notification Logic
  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Only trigger exactly on the hour to avoid spamming
      if (minutes !== 0) return;

      const todayStr = now.toISOString().split('T')[0];
      
      setData(prev => {
        const todayLogs = prev.logs[todayStr] || [];
        const systemQuests = getDailyQuests(prev.playerStats.level);
        const allSystemCompleted = systemQuests.every(q => todayLogs.includes(q.id));
        const allCustomCompleted = prev.habits.every(h => todayLogs.includes(h.id));
        const allCompleted = allSystemCompleted && allCustomCompleted;

        if (!allCompleted) {
          if (hours === 8) {
            new Notification('System Message', {
              body: 'A new Daily Quest has arrived. Failure to complete it will result in a penalty.',
              icon: '/favicon.ico'
            });
          } else if (hours === 18) {
            new Notification('System Message', {
              body: 'Evening approaches. Your Daily Quest remains incomplete.',
              icon: '/favicon.ico'
            });
          } else if (hours === 22) {
            new Notification('System Warning', {
              body: 'Time is running out. Complete your Daily Quest to avoid the Penalty Zone.',
              icon: '/favicon.ico'
            });
          }
        }
        return prev;
      });
    };

    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save on Change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setUserName = (name: string) => {
    setData(prev => ({ ...prev, userName: name }));
  };

  const addHabit = (name: string, category: string, goal?: number, unit?: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      category,
      goal,
      unit
    };
    setData(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
  };

  const deleteHabit = (id: string) => {
    setData(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
    }));
  };

  const allocateStat = (stat: 'str' | 'vit' | 'agi' | 'int') => {
    setData(prev => {
      if (prev.playerStats.availablePoints <= 0) return prev;
      
      const newStats = { ...prev.playerStats };
      newStats[stat] += 1;
      newStats.availablePoints -= 1;
      
      if (stat === 'vit') {
        newStats.maxHp = 100 + (newStats.vit * 10);
        newStats.hp += 10; // Heal the new max HP amount
      }
      
      return { ...prev, playerStats: newStats };
    });
  };

  const resolvePenalty = () => {
    setData(prev => ({
      ...prev,
      dailyState: { ...prev.dailyState, isPenaltyZone: false }
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

      const newLogs = { ...prev.logs, [dateStr]: newDayLogs };
      
      // Check if ALL habits and system quests are completed today
      const systemQuests = getDailyQuests(prev.playerStats.level);
      const allSystemCompleted = systemQuests.every(q => newDayLogs.includes(q.id));
      const allCustomCompleted = prev.habits.every(h => newDayLogs.includes(h.id));
      const allCompletedNow = allSystemCompleted && allCustomCompleted;
      
      const wasAllCompleted = prev.dailyState.allCompleted;

      let newStats = { ...prev.playerStats };
      let newDailyState = { ...prev.dailyState, allCompleted: allCompletedNow };

      // Award XP only if transitioning to ALL completed
      if (allCompletedNow && !wasAllCompleted) {
        // 100 XP per perfect day
        newStats.xp += 100;
        
        let leveledUp = false;
        let requiredXp = calculateRequiredXP(newStats.level);
        
        while (newStats.xp >= requiredXp) {
          newStats.xp -= requiredXp;
          newStats.level++;
          newStats.availablePoints += 5;
          newStats.gold += Math.round(100 * Math.pow(newStats.level, 1.1));
          newStats.maxHp = 100 + (newStats.vit * 10);
          newStats.hp = newStats.maxHp; // Full heal on level up
          leveledUp = true;
          requiredXp = calculateRequiredXP(newStats.level);
        }
        
        if (leveledUp && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Level Up!', {
            body: `Congratulations! You have reached Level ${newStats.level}. You have unspent attribute points.`,
            icon: '/favicon.ico'
          });
        }
      } else if (!allCompletedNow && wasAllCompleted) {
        newStats.xp = Math.max(0, newStats.xp - 100);
      }

      return {
        ...prev,
        playerStats: newStats,
        dailyState: newDailyState,
        logs: newLogs
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
        setData(loadState()); // Reset to initial state
    }
  };

  const getSyncCode = () => {
    const syncData = {
      userName: data.userName,
      habits: data.habits,
      logs: data.logs,
      journalEntries: data.journalEntries,
      timestamp: new Date().toISOString()
    };
    try {
      // Use TextEncoder to handle UTF-8 characters (emojis) correctly
      const jsonString = JSON.stringify(syncData);
      const bytes = new TextEncoder().encode(jsonString);
      // Convert Uint8Array to binary string
      const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
      return btoa(binString);
    } catch (e) {
      console.error("Failed to generate sync code", e);
      return "";
    }
  };

  const importSyncCode = (code: string) => {
    try {
      // Remove any whitespaces/newlines from copy-paste
      const cleanCode = code.replace(/\s/g, '');
      
      // Decode Base64 to binary string
      const binString = atob(cleanCode);
      
      // Convert binary string to Uint8Array
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
      
      // Decode UTF-8 bytes to JSON string
      const jsonString = new TextDecoder().decode(bytes);
      
      const parsed = JSON.parse(jsonString);
      
      // Validation: Ensure it's an object
      if (!parsed || typeof parsed !== 'object') {
        console.error("Import failed: Parsed data is not an object");
        return false;
      }

      // Reconstruct state with fallbacks for safety
      const newData = {
          userName: typeof parsed.userName === 'string' ? parsed.userName : (data.userName || ''),
          playerStats: parsed.playerStats || data.playerStats,
          streakState: parsed.streakState || data.streakState,
          dailyState: parsed.dailyState || data.dailyState,
          habits: Array.isArray(parsed.habits) ? parsed.habits : [],
          logs: parsed.logs && typeof parsed.logs === 'object' ? parsed.logs : {},
          journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : []
      };
      
      setData(newData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return true;
    } catch (e) {
      console.error("Failed to import sync code:", e);
      return false;
    }
  };

  const value = {
    userName: data.userName,
    playerStats: data.playerStats,
    streakState: data.streakState,
    dailyState: data.dailyState,
    habits: data.habits,
    logs: data.logs,
    journalEntries: data.journalEntries,
    setUserName,
    addHabit,
    deleteHabit,
    toggleHabit,
    addJournalEntry,
    deleteJournalEntry,
    clearData,
    getSyncCode,
    importSyncCode,
    allocateStat,
    resolvePenalty
  };

  return (
    <LocalContext.Provider value={value}>
      {children}
    </LocalContext.Provider>
  );
};