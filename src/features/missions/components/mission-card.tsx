import { Check, Droplets, Footprints, HeartPulse } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppChip, AppText } from '@/features/mock-wallet/ui';
import type { ConditionValue, MissionDefinition } from '@/features/missions/types';
import { colors, fonts } from '@/shared/theme/tokens';
import { formatWholeNumber } from '@/shared/utils/format';

const conditionOptions: ConditionValue[] = ['Good', 'Okay', 'Tired', 'Sick'];

export function MissionCard({
  completed,
  condition,
  mission,
  onChooseCondition,
  onComplete,
  stepCount,
}: {
  completed: boolean;
  condition: ConditionValue | null;
  mission: MissionDefinition;
  onChooseCondition: (condition: ConditionValue) => void;
  onComplete: () => void;
  stepCount: number;
}) {
  const isSteps = mission.kind === 'steps';
  const isCondition = mission.kind === 'condition';
  const progress = isSteps && mission.target ? Math.min(stepCount / mission.target, 1) : completed ? 1 : 0;
  const disabled = completed || (isCondition && !condition);
  const actionLabel = completed ? 'Completed' : isSteps ? 'Complete demo' : 'Complete';

  return (
    <View style={[styles.card, completed && styles.cardComplete]}>
      <View style={styles.top}>
        <View style={[styles.icon, completed && styles.iconComplete]}>
          <MissionIcon mission={mission} completed={completed} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText style={[styles.title, completed && styles.titleComplete]}>{mission.title}</AppText>
            <AppText variant="caption" style={[styles.points, completed && styles.pointsComplete]}>
              +{mission.points} P
            </AppText>
          </View>
          <AppText tone="muted" variant="caption">
            {mission.subtitle}
          </AppText>
        </View>
      </View>

      {isSteps && mission.target ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressMeta}>
            <AppText tone="muted" variant="caption">
              {formatWholeNumber(stepCount)} / {formatWholeNumber(mission.target)} steps
            </AppText>
            <AppText tone="muted" variant="caption">
              {Math.round(progress * 100)}%
            </AppText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, completed && styles.progressFillComplete, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      ) : null}

      {isCondition ? (
        <View style={styles.conditionRow}>
          {conditionOptions.map((option) => (
            <AppChip active={condition === option} disabled={completed} key={option} onPress={() => onChooseCondition(option)}>
              {option}
            </AppChip>
          ))}
        </View>
      ) : null}

      <Pressable disabled={disabled} onPress={onComplete} style={[styles.cta, completed && styles.ctaComplete, disabled && !completed && styles.ctaDisabled]}>
        <AppText style={[styles.ctaLabel, completed && styles.ctaLabelComplete]}>
          {actionLabel}
        </AppText>
        {completed ? <Check color={colors.textSubtle} size={16} /> : null}
      </Pressable>
    </View>
  );
}

function MissionIcon({ completed, mission }: { completed: boolean; mission: MissionDefinition }) {
  const color = completed ? colors.textSubtle : colors.accent;

  if (mission.id === 'drink-water') {
    return <Droplets color={color} size={20} />;
  }

  if (mission.id === 'walk-steps') {
    return <Footprints color={color} size={20} />;
  }

  return <HeartPulse color={color} size={20} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(250, 248, 244, 0.86)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  cardComplete: {
    backgroundColor: 'rgba(31, 27, 22, 0.035)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
    opacity: 0.72,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 14,
  },
  ctaComplete: {
    backgroundColor: 'rgba(31, 27, 22, 0.045)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    color: colors.accentInk,
    fontFamily: fonts.latinBold,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 17,
  },
  ctaLabelComplete: {
    color: colors.textSubtle,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 17, 31, 0.9)',
    borderColor: 'rgba(225, 244, 50, 0.18)',
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconComplete: {
    backgroundColor: 'rgba(31, 27, 22, 0.045)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
  },
  points: {
    color: colors.accentInk,
    fontFamily: fonts.latinBold,
    backgroundColor: 'rgba(225, 244, 50, 0.7)',
    borderRadius: 999,
    includeFontPadding: false,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pointsComplete: {
    backgroundColor: 'rgba(31, 27, 22, 0.055)',
    color: colors.textSubtle,
  },
  progressBlock: {
    gap: 7,
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%',
  },
  progressFillComplete: {
    backgroundColor: 'rgba(31, 27, 22, 0.2)',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    backgroundColor: 'rgba(31, 27, 22, 0.09)',
    borderRadius: 999,
    height: 7,
    overflow: 'hidden',
  },
  title: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleComplete: {
    color: colors.textMuted,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    gap: 12,
  },
});
