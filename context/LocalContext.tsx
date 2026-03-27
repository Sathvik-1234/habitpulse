import React, { createContext, useContext, useEffect, useState } from 'react';
import { Habit, HabitLogs, JournalEntry, PlayerStats, StreakState, DailyState } from '../types';
import { getDailyQuests, calculateRequiredXP } from '../lib/system';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface LocalContextType {
  userName: string;
  playerStats: PlayerStats;
  streakState: StreakState;
  dailyState: DailyState;
  habits: Habit[];
  logs: HabitLogs;
  journalEntries: JournalEntry[];
  isNewUser: boolean;
  loadingData: boolean;
  registerUser: (name: string) => Promise<void>;
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

const defaultState = {
  userName: '',
  playerStats: {
    level: 1,
    xp: 0,
    gold: 0,
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

export const LocalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [data, setData] = useState(defaultState);
  const [loadingData, setLoadingData] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Initial State Load from Firestore
  useEffect(() => {
    if (!currentUser) {
      setLoadingData(false);
      setIsNewUser(false);
      setData(defaultState);
      return;
    }

    const loadData = async () => {
      setLoadingData(true);
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const parsed = docSnap.data() as any;
          // Ensure new fields exist for backward compatibility
          if (parsed.playerStats?.gold === undefined) parsed.playerStats.gold = 0;
          if (!parsed.streakState) parsed.streakState = { currentStreak: 0, longestStreak: 0, perfectDaysTotal: 0 };
          if (!parsed.dailyState) parsed.dailyState = { date: new Date().toISOString().split('T')[0], isPenaltyZone: false, allCompleted: false };
          
          setData({
            userName: parsed.userName || parsed.playerName || '',
            playerStats: parsed.playerStats || defaultState.playerStats,
            streakState: parsed.streakState || defaultState.streakState,
            dailyState: parsed.dailyState || defaultState.dailyState,
            habits: parsed.habits || [],
            logs: parsed.logs || {},
            journalEntries: parsed.journalEntries || []
          });
          setIsNewUser(false);
        } else {
          setIsNewUser(true);
        }
      } catch (e) {
        console.error("Failed to load data from Firestore", e);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [currentUser]);

  const registerUser = async (name: string) => {
    if (!currentUser) return;
    const newState = {
      ...defaultState,
      userName: name,
      playerName: name // For backward compatibility if needed
    };
    try {
      await setDoc(doc(db, 'users', currentUser.uid), newState);
      setData(newState);
      setIsNewUser(false);
    } catch (e) {
      console.error("Failed to register user", e);
      throw e;
    }
  };

  // Save on Change to Firestore
  useEffect(() => {
    if (currentUser && !isNewUser && !loadingData) {
      setDoc(doc(db, 'users', currentUser.uid), data).catch(console.error);
    }
  }, [data, currentUser, isNewUser, loadingData]);

  // Midnight Check & Penalty Logic
  useEffect(() => {
    if (!currentUser || isNewUser || loadingData) return;

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
              newDailyState.isPenaltyZone = false; // Reset penalty zone after level down
            } else {
              // Failed normal day -> Enter Penalty Zone
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
  }, [currentUser, isNewUser, loadingData]);

  // Reminder Notification Logic
  useEffect(() => {
    if (!currentUser || isNewUser || loadingData) return;

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
  }, [currentUser, isNewUser, loadingData]);

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
        setData(defaultState);
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
      const jsonString = JSON.stringify(syncData);
      const bytes = new TextEncoder().encode(jsonString);
      const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
      return btoa(binString);
    } catch (e) {
      console.error("Failed to generate sync code", e);
      return "";
    }
  };

  const importSyncCode = (code: string) => {
    try {
      const cleanCode = code.replace(/\s/g, '');
      const binString = atob(cleanCode);
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
      const jsonString = new TextDecoder().decode(bytes);
      const parsed = JSON.parse(jsonString);
      
      if (!parsed || typeof parsed !== 'object') {
        console.error("Import failed: Parsed data is not an object");
        return false;
      }

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
    isNewUser,
    loadingData,
    registerUser,
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