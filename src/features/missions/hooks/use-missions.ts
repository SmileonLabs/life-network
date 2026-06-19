import { useCallback, useMemo, useState } from 'react';

import {
  dailyMissions,
  dailyMissionSuccessThreshold,
  dailyMissionTargetCount,
  mockStepCount,
  streakMilestones,
} from '@/features/missions/data';
import type {
  ConditionValue,
  MissionId,
  MissionStorageState,
  PointHistoryItem,
} from '@/features/missions/types';
import { readStorageValue, writeStorageValue } from '@/shared/utils/storage';

const missionStorageKey = 'life-missions-demo-state';

export function useMissions() {
  const [state, setState] = useState<MissionStorageState>(() => readInitialState());

  const completedCount = useMemo(
    () => dailyMissions.filter((mission) => Boolean(state.completed[mission.id])).length,
    [state.completed],
  );
  const isDailyGoalMet = completedCount >= dailyMissionSuccessThreshold;
  const nextMilestone = useMemo(
    () => streakMilestones.find((milestone) => milestone.days > state.streak) ?? streakMilestones[streakMilestones.length - 1],
    [state.streak],
  );

  const chooseCondition = useCallback((condition: ConditionValue) => {
    setState((current) => writeAndReturn({ ...current, condition }));
  }, []);

  const completeMission = useCallback((missionId: MissionId) => {
    setState((current) => {
      if (current.completed[missionId]) {
        return current;
      }

      const mission = dailyMissions.find((item) => item.id === missionId);

      if (!mission) {
        return current;
      }

      if (mission.id === 'log-condition' && !current.condition) {
        return current;
      }

      const timestamp = new Date().toISOString();
      const completed = {
        ...current.completed,
        [missionId]: true,
      };
      const missionHistory = createHistoryItem({
        points: mission.points,
        subtitle: mission.id === 'log-condition' && current.condition ? current.condition : mission.subtitle,
        title: mission.title,
        type: 'mission',
      }, timestamp);
      const nextCompletedCount = dailyMissions.filter((item) => Boolean(completed[item.id])).length;
      let nextClaimedMilestones = current.claimedMilestones;
      let nextHistory: PointHistoryItem[] = [missionHistory, ...current.history];
      let nextPoints = current.points + mission.points;
      let nextStreak = current.streak;
      let todayStreakApplied = current.todayStreakApplied;

      if (nextCompletedCount >= dailyMissionSuccessThreshold && !current.todayStreakApplied) {
        nextStreak += 1;
        todayStreakApplied = true;

        const bonus = streakMilestones.find((milestone) => milestone.days === nextStreak);

        if (bonus && !current.claimedMilestones.includes(bonus.days)) {
          nextClaimedMilestones = [...current.claimedMilestones, bonus.days];
          nextPoints += bonus.points;
          nextHistory = [
            createHistoryItem({
              points: bonus.points,
              subtitle: `${bonus.days} day streak`,
              title: 'Streak bonus',
              type: 'streak',
            }, timestamp),
            ...nextHistory,
          ];
        }
      }

      return writeAndReturn({
        ...current,
        claimedMilestones: nextClaimedMilestones,
        completed,
        history: nextHistory,
        points: nextPoints,
        streak: nextStreak,
        todayStreakApplied,
      });
    });
  }, []);

  return {
    chooseCondition,
    completeMission,
    completedCount,
    condition: state.condition,
    dailyGoalThreshold: dailyMissionSuccessThreshold,
    isDailyGoalMet,
    missions: dailyMissions,
    nextMilestone,
    pointHistory: state.history,
    points: state.points,
    state,
    stepCount: mockStepCount,
    streak: state.streak,
    streakMilestones,
    totalMissions: dailyMissionTargetCount,
  };
}

function readInitialState(): MissionStorageState {
  const today = getDateKey();
  const stored = readStorageValue<MissionStorageState>(missionStorageKey);

  if (!stored) {
    return {
      claimedMilestones: [],
      completed: {},
      condition: null,
      date: today,
      history: [],
      points: 1200,
      streak: 2,
      todayStreakApplied: false,
    };
  }

  if (stored.date !== today) {
    return {
      ...stored,
      completed: {},
      condition: null,
      date: today,
      todayStreakApplied: false,
    };
  }

  return stored;
}

function writeAndReturn(state: MissionStorageState) {
  writeStorageValue(missionStorageKey, state);
  return state;
}

function createHistoryItem(
  item: Omit<PointHistoryItem, 'id' | 'timestamp'>,
  timestamp: string,
): PointHistoryItem {
  return {
    ...item,
    id: `${item.type}:${item.title}:${timestamp}`,
    timestamp,
  };
}

function getDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `${year}-${month}-${day}`;
}

function pad2(value: number) {
  return value < 10 ? `0${value}` : String(value);
}
