import { Sparkles } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

import { AppText } from '@/features/mock-wallet/ui';
import type { StreakMilestone } from '@/features/missions/types';
import { colors, fonts } from '@/shared/theme/tokens';
import { formatWholeNumber } from '@/shared/utils/format';

export function MissionSummaryCard({
  completedCount,
  nextMilestone,
  points,
  streak,
  totalMissions,
}: {
  completedCount: number;
  nextMilestone: StreakMilestone;
  points: number;
  streak: number;
  totalMissions: number;
}) {
  const progress = totalMissions > 0 ? completedCount / totalMissions : 0;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <View style={styles.badge}>
            <Sparkles color={colors.accent} size={14} />
            <AppText style={styles.badgeText}>LIFE POINTS</AppText>
          </View>
          <AppText style={styles.points}>{formatWholeNumber(points)} P</AppText>
          <AppText style={styles.subText}>
            {completedCount} of {totalMissions} missions completed today
          </AppText>
        </View>
        <View style={styles.todayPill}>
          <AppText style={styles.todayPillText}>{completedCount}/{totalMissions}</AppText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <AppText style={styles.statLabel} variant="caption">
            Current streak
          </AppText>
          <AppText style={styles.statValue}>{streak} days</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <AppText style={styles.statLabel} variant="caption">
            Next bonus
          </AppText>
          <AppText style={styles.statValue}>
            {nextMilestone.days} days · +{nextMilestone.points} P
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(225, 244, 50, 0.12)',
    borderColor: 'rgba(225, 244, 50, 0.28)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 28,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: colors.accent,
    fontFamily: fonts.latinBold,
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
    letterSpacing: 0.8,
    lineHeight: 14,
  },
  card: {
    backgroundColor: colors.text,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 14,
  },
  copy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  divider: {
    backgroundColor: 'rgba(250, 248, 244, 0.12)',
    height: 34,
    width: 1,
  },
  points: {
    color: colors.white,
    fontFamily: fonts.latinBlack,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: 'rgba(250, 248, 244, 0.14)',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  stats: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.08)',
    borderColor: 'rgba(250, 248, 244, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  statLabel: {
    color: 'rgba(250,248,244,0.62)',
  },
  statValue: {
    color: colors.white,
    fontFamily: fonts.latinBold,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subText: {
    color: 'rgba(250,248,244,0.72)',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  todayPill: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  todayPillText: {
    color: colors.accentInk,
    fontFamily: fonts.latinBlack,
    fontSize: 13,
    fontWeight: '900',
    includeFontPadding: false,
    lineHeight: 17,
  },
  top: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
});
