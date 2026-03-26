export interface SystemQuest {
  id: string;
  name: string;
  goal: number;
  unit: string;
  category: string;
}

export const calculateRequiredXP = (level: number) => {
  // Level 20 takes exactly 15 days (1500 XP at 100 XP/day)
  // 1500 = 100 * (Multiplier ^ 20) -> Multiplier ≈ 1.146128
  return Math.floor(100 * Math.pow(1.146128, level));
};

export const getDailyQuests = (level: number): SystemQuest[] => {
  const quests: SystemQuest[] = [
    { id: 'sys_pushups', name: 'Push-ups', goal: Math.min(100, 10 + (level - 1) * 2), unit: 'reps', category: 'Strength' },
    { id: 'sys_situps', name: 'Sit-ups', goal: Math.min(100, 10 + (level - 1) * 2), unit: 'reps', category: 'Strength' },
    { id: 'sys_squats', name: 'Squats', goal: Math.min(100, 10 + (level - 1) * 2), unit: 'reps', category: 'Strength' },
    { id: 'sys_run', name: 'Running', goal: Math.min(10, 1 + Math.floor((level - 1) / 5) * 0.5), unit: 'km', category: 'Endurance' },
  ];

  if (level >= 5) {
    quests.push({ id: 'sys_meditation', name: 'Meditation', goal: Math.min(20, 5 + (level - 5) * 1), unit: 'mins', category: 'Spirit' });
  }
  if (level >= 15) {
    quests.push({ id: 'sys_reading', name: 'Intelligence', goal: 10, unit: 'pages', category: 'Intellect' });
  }

  return quests;
};

export const getPenaltyQuests = (level: number): SystemQuest[] => {
  return [
    { id: 'pen_pushups', name: 'Penalty Push-ups', goal: Math.min(100, 10 + (level - 1) * 2) * 2, unit: 'reps', category: 'Survival' },
    { id: 'pen_situps', name: 'Penalty Sit-ups', goal: Math.min(100, 10 + (level - 1) * 2) * 2, unit: 'reps', category: 'Survival' },
    { id: 'pen_squats', name: 'Penalty Squats', goal: Math.min(100, 10 + (level - 1) * 2) * 2, unit: 'reps', category: 'Survival' },
    { id: 'pen_run', name: 'Penalty Running', goal: Math.min(10, 1 + Math.floor((level - 1) / 5) * 0.5) * 2, unit: 'km', category: 'Survival' },
  ];
};
