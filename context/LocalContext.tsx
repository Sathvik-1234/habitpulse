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
  addHabit: (name: string, category: string, goal?: number, unit?: string, dueDate?: string, dueTime?: string) => void;
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
      console.log("onSnapshot fired. exists:", docSnap.exists());
      if (docSnap.exists()) {
        const parsed = docSnap.data() as any;
        console.log("Firestore data:", parsed);
        
        const fetchedUserName = parsed.userName || parsed.playerName || currentUser.displayName || 'Player';
        console.log("Setting userName to:", fetchedUserName);
        
        // Automatically save the display name if it wasn't in Firestore
        if (!parsed.userName && !parsed.playerName && currentUser.displayName) {
          updatePlayerStats(currentUser.uid, { userName: currentUser.displayName }).catch(console.error);
        }
        
        if (parsed.playerStats?.gold === undefined) parsed.playerStats.gold = 0;
        if (!parsed.streakState) parsed.streakState = { currentStreak: 0, longestStreak: 0, perfectDaysTotal: 0 };
        if (!parsed.dailyState) parsed.dailyState = { date: new Date().toISOString().split('T')[0], isPenaltyZone: false, allCompleted: false };
        
        setData({
          userName: fetchedUserName,
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
        const completedSystemCount = systemQuests.filter(q => yesterdayLogs.includes(q.id)).length;
        const completedHabitCount = currentData.habits.filter(h => yesterdayLogs.includes(h.id)).length;
        
        const totalCompletedYesterday = completedSystemCount + completedHabitCount;
        const totalTasksYesterday = systemQuests.length + currentData.habits.length;
        const allCompletedYesterday = totalCompletedYesterday === totalTasksYesterday;
        
        let newStreakState = { ...currentData.streakState };
        let newPlayerStats = { ...currentData.playerStats };
        let newDailyState = { date: todayStr, isPenaltyZone: false, allCompleted: false };
        let newHabits = [...currentData.habits];

        if (allCompletedYesterday && totalTasksYesterday > 0) {
          newStreakState.currentStreak += 1;
          newStreakState.longestStreak = Math.max(newStreakState.longestStreak, newStreakState.currentStreak);
          newStreakState.perfectDaysTotal += 1;
        } else if (totalTasksYesterday > 0) {
          newStreakState.currentStreak = 0;
          
          if (totalCompletedYesterday === 0) {
            newPlayerStats.xp = Math.max(0, newPlayerStats.xp - 50);
          }

          const penaltyExists = newHabits.some(h => h.name.includes('[SYSTEM PENALTY: SURVIVAL QUEST]'));
          if (!penaltyExists) {
            newHabits.push({
              id: crypto.randomUUID(),
              name: '[SYSTEM PENALTY: SURVIVAL QUEST]',
              category: 'Penalty',
              goal: 1,
              unit: 'Completion'
            });
          }
          sendSystemNotification('System Penalty', 'You failed to complete all quests yesterday. A penalty quest has been assigned.');
        }

        setData(prev => ({
          ...prev,
          playerStats: newPlayerStats,
          streakState: newStreakState,
          dailyState: newDailyState,
          habits: newHabits
        }));

        await updatePlayerStats(currentUser.uid, {
          playerStats: newPlayerStats,
          streakState: newStreakState,
          dailyState: newDailyState,
          habits: newHabits
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
      
      const todayStr = now.toISOString().split('T')[0];
      const todayLogs = currentData.logs[todayStr] || [];

      // Check specific task reminders
      currentData.habits.forEach(habit => {
        if (todayLogs.includes(habit.id)) return; // already completed
        
        if (habit.dueTime) {
          const [dueHours, dueMinutes] = habit.dueTime.split(':').map(Number);
          
          // Remind 15 minutes before
          let remindDate = new Date();
          remindDate.setHours(dueHours, dueMinutes, 0, 0);
          remindDate.setMinutes(remindDate.getMinutes() - 15);
          
          if (now.getHours() === remindDate.getHours() && now.getMinutes() === remindDate.getMinutes()) {
            sendSystemNotification('Upcoming Quest', `[${habit.name}] is due in 15 minutes!`);
          }
          
          // Overdue notification
          if (now.getHours() === dueHours && now.getMinutes() === dueMinutes) {
            sendSystemNotification('Quest Overdue', `[${habit.name}] is now overdue!`);
          }
        }
      });

      if (minutes !== 0) return;

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

  const addHabit = async (name: string, category: string, goal?: number, unit?: string, dueDate?: string, dueTime?: string) => {
    if (!currentUser) return;
    const newHabit: Habit = { id: crypto.randomUUID(), name, category, goal, unit, dueDate, dueTime };
    const newHabits = [...data.habits, newHabit];
    setData(prev => ({ ...prev, habits: newHabits }));
    await updatePlayerStats(currentUser.uid, { habits: newHabits });
  };

  const deleteHabit = async (id: string) => {
    if (!currentUser) return;
    const newHabits = data.habits.filter(h => h.id !== id);
    setData(prev => ({ ...prev, habits: newHabits }));
    await updatePlayerStats(currentUser.uid, { habits: newHabits });
  };

  const allocateStat = async (stat: 'str' | 'vit' | 'agi' | 'int') => {
    if (!currentUser || data.playerStats.availablePoints <= 0) return;
    const newStats = { ...data.playerStats };
    newStats[stat] += 1;
    newStats.availablePoints -= 1;
    setData(prev => ({ ...prev, playerStats: newStats }));
    await updatePlayerStats(currentUser.uid, { playerStats: newStats });
  };

  const resolvePenalty = async () => {
    if (!currentUser) return;
    const newDailyState = { ...data.dailyState, isPenaltyZone: false };
    setData(prev => ({ ...prev, dailyState: newDailyState }));
    await updatePlayerStats(currentUser.uid, { dailyState: newDailyState });
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

    // Optimistic UI update
    setData(prev => ({
      ...prev,
      playerStats: newStats,
      dailyState: newDailyState,
      logs: newLogs
    }));

    await updatePlayerStats(currentUser.uid, {
      playerStats: newStats,
      dailyState: newDailyState,
      logs: newLogs
    });
  };

  const addJournalEntry = async (mood: string, tags: string[], content: string, date: string) => {
    if (!currentUser) return;
    const newEntry: JournalEntry = { id: crypto.randomUUID(), date, mood: mood as any, tags, content };
    const newEntries = [newEntry, ...data.journalEntries];
    setData(prev => ({ ...prev, journalEntries: newEntries }));
    await updatePlayerStats(currentUser.uid, { journalEntries: newEntries });
  };

  const deleteJournalEntry = async (id: string) => {
    if (!currentUser) return;
    const newEntries = data.journalEntries.filter(e => e.id !== id);
    setData(prev => ({ ...prev, journalEntries: newEntries }));
    await updatePlayerStats(currentUser.uid, { journalEntries: newEntries });
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
