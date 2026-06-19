import { StyleSheet, View } from 'react-native';

import { AppScreen, AppSurface, AppText } from '@/features/mock-wallet/ui';
import { MissionCard } from '@/features/missions/components/mission-card';
import { MissionSummaryCard } from '@/features/missions/components/mission-summary-card';
import { PointHistoryRow } from '@/features/missions/components/point-history-row';
import { StreakBonusCard } from '@/features/missions/components/streak-bonus-card';
import { useMissions } from '@/features/missions/hooks/use-missions';
import { colors, fonts } from '@/shared/theme/tokens';

export function MissionsScreen() {
  const missions = useMissions();

  return (
    <AppScreen bottomNav>
      <MissionSummaryCard
        completedCount={missions.completedCount}
        nextMilestone={missions.nextMilestone}
        points={missions.points}
        streak={missions.streak}
        totalMissions={missions.totalMissions}
      />

      <View style={styles.section}>
        <SectionTitle label="Today's Missions" meta={`${missions.completedCount}/${missions.totalMissions} completed`} />
        <View style={styles.stack}>
          {missions.missions.map((mission) => (
            <MissionCard
              completed={Boolean(missions.state.completed[mission.id])}
              condition={missions.condition}
              key={mission.id}
              mission={mission}
              onChooseCondition={missions.chooseCondition}
              onComplete={() => missions.completeMission(mission.id)}
              stepCount={missions.stepCount}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle label="Streak Bonus" meta={`Goal: ${missions.dailyGoalThreshold}+ missions/day`} />
        <StreakBonusCard
          claimedMilestones={missions.state.claimedMilestones}
          milestones={missions.streakMilestones}
          streak={missions.streak}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle label="Point History" meta="Today" />
        {missions.pointHistory.length > 0 ? (
          <View style={styles.stack}>
            {missions.pointHistory.map((item) => (
              <PointHistoryRow item={item} key={item.id} />
            ))}
          </View>
        ) : (
          <AppSurface style={styles.empty}>
            <AppText tone="muted">Complete missions to earn LIFE Points.</AppText>
          </AppSurface>
        )}
      </View>
    </AppScreen>
  );
}

function SectionTitle({ label, meta }: { label: string; meta?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <AppText style={styles.sectionTitleText}>{label}</AppText>
      {meta ? (
        <AppText tone="muted" variant="caption">
          {meta}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitleText: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  stack: {
    gap: 8,
  },
});
