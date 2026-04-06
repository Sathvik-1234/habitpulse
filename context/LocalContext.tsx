import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Habit, HabitLogs, JournalEntry, PlayerStats, StreakState, DailyState } from '../types';
import { getDailyQuests, calculateRequiredXP } from '../lib/system';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { updatePlayerStats } from '../lib/firebaseUtils';
import { sendSystemNotification } from '../lib/notifications';

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

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Real-time State Load from Firestore via onSnapshot
  useEffect(() => {
    if (!currentUser) {
      setLoadingData(false);
      setIsNewUser(false);
      setData(defaultState);
      return;
    }

    setLoadingData(true);
    const docRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const parsed = docSnap.data() as any;
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
      setLoadingData(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const registerUser = async (name: string) => {
    if (!currentUser) return;
    const newState = {
      ...defaultState,
      userName: name,
      playerName: name
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

  // Midnight Check & Penalty Logic
  useEffect(() => {
    if (!currentUser || isNewUser || loadingData) return;

    const checkMidnight = async () => {
      const currentData = dataRef.current;
      const todayStr = new Date().toISOString().split('T')[0];
      
      if (currentData.dailyState.date !== todayStr) {
        const yesterdayStr = currentData.dailyState.date;
        const yesterdayLogs = currentData.logs[yesterdayStr] || [];
        
        const systemQuests = getDailyQuests(currentData.playerStats.level);
        const allSystemCompleted = systemQuests.every(q => yesterdayLogs.includes(q.id));
        const allCustomCompleted = currentData.habits.every(h => yesterdayLogs.includes(h.id));
        const allCompletedYesterday = allSystemCompleted && allCustomCompleted;
        
        let newStreakState = { ...currentData.streakState };
        let newPlayerStats = { ...currentData.playerStats };
        let newDailyState = { date: todayStr, isPenaltyZone: false, allCompleted: false };

        if (allCompletedYesterday) {
          newStreakState.currentStreak += 1;
          newStreakState.longestStreak = Math.max(newStreakState.longestStreak, newStreakState.currentStreak);
          newStreakState.perfectDaysTotal += 1;
        } else {
          newStreakState.currentStreak = 0;
          if (currentData.dailyState.isPenaltyZone) {
            newPlayerStats.level = Math.max(1, newPlayerStats.level - 1);
            newPlayerStats.xp = 0;
            newDailyState.isPenaltyZone = false;
          } else {
            newDailyState.isPenaltyZone = true;
            sendSystemNotification('Penalty Zone Entered', 'You failed to complete your daily quests. Survive the penalty zone to restore your status.');
          }
        }

        await updatePlayerStats(currentUser.uid, {
          playerStats: newPlayerStats,
          streakState: newStreakState,
          dailyState: newDailyState
        });
      }
    };

    checkMidnight();
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [currentUser, isNewUser, loadingData]);

  // Reminder Notification Logic
  useEffect(() => {
    if (!currentUser || isNewUser || loadingData) return;

    const checkReminders = () => {
      const currentData = dataRef.current;
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (minutes !== 0) return;

      const todayStr = now.toISOString().split('T')[0];
      const todayLogs = currentData.logs[todayStr] || [];
      const systemQuests = getDailyQuests(currentData.playerStats.level);
      const allSystemCompleted = systemQuests.every(q => todayLogs.includes(q.id));
      const allCustomCompleted = currentData.habits.every(h => todayLogs.includes(h.id));
      const allCompleted = allSystemCompleted && allCustomCompleted;

      if (!allCompleted) {
        if (hours === 8) {
          sendSystemNotification('System Message', 'A new Daily Quest has arrived. Failure to complete it will result in a penalty.');
        } else if (hours === 20) {
          sendSystemNotification('System Warning', 'Time is running out. Complete your Daily Quest to avoid the Penalty Zone.');
        }
      }
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [currentUser, isNewUser, loadingData]);

  const setUserName = async (name: string) => {
    if (!currentUser) return;
    await updatePlayerStats(currentUser.uid, { userName: name });
  };

  const addHabit = async (name: string, category: string, goal?: number, unit?: string) => {
    if (!currentUser) return;
    const newHabit: Habit = { id: crypto.randomUUID(), name, category, goal, unit };
    await updatePlayerStats(currentUser.uid, { habits: [...data.habits, newHabit] });
  };

  const deleteHabit = async (id: string) => {
    if (!currentUser) return;
    await updatePlayerStats(currentUser.uid, { habits: data.habits.filter(h => h.id !== id) });
  };

  const allocateStat = async (stat: 'str' | 'vit' | 'agi' | 'int') => {
    if (!currentUser || data.playerStats.availablePoints <= 0) return;
    const newStats = { ...data.playerStats };
    newStats[stat] += 1;
    newStats.availablePoints -= 1;
    await updatePlayerStats(currentUser.uid, { playerStats: newStats });
  };

  const resolvePenalty = async () => {
    if (!currentUser) return;
    await updatePlayerStats(currentUser.uid, { dailyState: { ...data.dailyState, isPenaltyZone: false } });
  };

  const toggleHabit = async (habitId: string, dateStr: string) => {
    if (!currentUser) return;
    const currentDayLogs = data.logs[dateStr] || [];
    const isCompleted = currentDayLogs.includes(habitId);
    
    let newDayLogs = isCompleted 
      ? currentDayLogs.filter(id => id !== habitId)
      : [...currentDayLogs, habitId];

    const newLogs = { ...data.logs, [dateStr]: newDayLogs };
    
    const systemQuests = getDailyQuests(data.playerStats.level);
    const allSystemCompleted = systemQuests.every(q => newDayLogs.includes(q.id));
    const allCustomCompleted = data.habits.every(h => newDayLogs.includes(h.id));
    const allCompletedNow = allSystemCompleted && allCustomCompleted;
    
    const wasAllCompleted = data.dailyState.allCompleted;

    let newStats = { ...data.playerStats };
    let newDailyState = { ...data.dailyState, allCompleted: allCompletedNow };

    if (allCompletedNow && !wasAllCompleted) {
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
      
      if (leveledUp) {
        sendSystemNotification('Level Up!', `Congratulations! You have reached Level ${newStats.level}. You have unspent attribute points.`);
      }
    } else if (!allCompletedNow && wasAllCompleted) {
      newStats.xp = Math.max(0, newStats.xp - 100);
    }

    await updatePlayerStats(currentUser.uid, {
      playerStats: newStats,
      dailyState: newDailyState,
      logs: newLogs
    });
  };

  const addJournalEntry = async (mood: string, tags: string[], content: string, date: string) => {
    if (!currentUser) return;
    const newEntry: JournalEntry = { id: crypto.randomUUID(), date, mood: mood as any, tags, content };
    await updatePlayerStats(currentUser.uid, { journalEntries: [newEntry, ...data.journalEntries] });
  };

  const deleteJournalEntry = async (id: string) => {
    if (!currentUser) return;
    await updatePlayerStats(currentUser.uid, { journalEntries: data.journalEntries.filter(e => e.id !== id) });
  };

  const clearData = () => {
    if(window.confirm("Are you sure you want to reset all data?")) {
        if (currentUser) {
          updatePlayerStats(currentUser.uid, defaultState);
        }
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
      
      if (currentUser) {
        updatePlayerStats(currentUser.uid, newData);
      }
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
