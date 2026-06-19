import { StyleSheet, View } from 'react-native';

import { AppText } from '@/features/mock-wallet/ui';
import type { StreakMilestone } from '@/features/missions/types';
import { colors, fonts } from '@/shared/theme/tokens';

export function StreakBonusCard({
  claimedMilestones,
  milestones,
  streak,
}: {
  claimedMilestones: number[];
  milestones: StreakMilestone[];
  streak: number;
}) {
  return (
    <View style={styles.card}>
      {milestones.map((milestone) => {
        const reached = streak >= milestone.days;
        const claimed = claimedMilestones.includes(milestone.days);

        return (
          <View key={milestone.days} style={[styles.milestone, reached && styles.milestoneReached]}>
            <View style={[styles.dot, reached && styles.dotReached]} />
            <View style={styles.copy}>
              <AppText style={styles.title}>{milestone.days} days</AppText>
              <AppText tone="muted" variant="caption">
                +{milestone.points} P bonus
              </AppText>
            </View>
            <AppText tone={claimed ? 'lime' : reached ? 'amber' : 'muted'} variant="caption">
              {claimed ? 'Claimed' : reached ? 'Ready' : `${Math.max(milestone.days - streak, 0)} left`}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(250, 248, 244, 0.86)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 8,
  },
  copy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  dot: {
    backgroundColor: 'rgba(31, 27, 22, 0.16)',
    borderColor: 'rgba(31, 27, 22, 0.1)',
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  dotReached: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  milestone: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 11,
  },
  milestoneReached: {
    backgroundColor: 'rgba(225, 244, 50, 0.12)',
  },
  title: {
    fontFamily: fonts.latinBold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
});
