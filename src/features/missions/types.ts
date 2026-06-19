export type MissionId = 'drink-water' | 'walk-steps' | 'log-condition';

export type ConditionValue = 'Good' | 'Okay' | 'Tired' | 'Sick';

export type MissionKind = 'check' | 'steps' | 'condition';

export type MissionDefinition = {
  id: MissionId;
  title: string;
  subtitle: string;
  points: number;
  kind: MissionKind;
  target?: number;
};

export type MissionCompletionState = Partial<Record<MissionId, boolean>>;

export type PointHistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  points: number;
  timestamp: string;
  type: 'mission' | 'streak';
};

export type StreakMilestone = {
  days: number;
  points: number;
};

export type MissionStorageState = {
  claimedMilestones: number[];
  completed: MissionCompletionState;
  condition: ConditionValue | null;
  date: string;
  history: PointHistoryItem[];
  points: number;
  streak: number;
  todayStreakApplied: boolean;
};
