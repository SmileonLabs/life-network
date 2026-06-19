import type { MissionDefinition, StreakMilestone } from '@/features/missions/types';

export const dailyMissionTargetCount = 3;
export const dailyMissionSuccessThreshold = 2;
export const mockStepCount = 3420;

export const dailyMissions: MissionDefinition[] = [
  {
    id: 'drink-water',
    kind: 'check',
    points: 10,
    subtitle: 'Check in once after drinking water today.',
    title: 'Drink water',
  },
  {
    id: 'walk-steps',
    kind: 'steps',
    points: 30,
    subtitle: 'Walk 5,000 steps to complete this mission.',
    target: 5000,
    title: 'Walk 5,000 steps',
  },
  {
    id: 'log-condition',
    kind: 'condition',
    points: 20,
    subtitle: 'Record how your body feels today.',
    title: 'Log condition',
  },
];

export const streakMilestones: StreakMilestone[] = [
  { days: 3, points: 30 },
  { days: 7, points: 100 },
  { days: 14, points: 250 },
  { days: 30, points: 700 },
];
