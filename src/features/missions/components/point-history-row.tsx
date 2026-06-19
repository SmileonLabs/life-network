import { CircleDollarSign } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/features/mock-wallet/ui';
import type { PointHistoryItem } from '@/features/missions/types';
import { colors, fonts } from '@/shared/theme/tokens';

export function PointHistoryRow({ item }: { item: PointHistoryItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <CircleDollarSign color={item.type === 'streak' ? colors.amber : colors.accent} size={18} />
      </View>
      <View style={styles.copy}>
        <AppText>{item.title}</AppText>
        <AppText numberOfLines={1} tone="muted" variant="caption">
          {item.subtitle}
        </AppText>
      </View>
      <AppText style={styles.points}>
        +{item.points} P
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: 0,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 17, 31, 0.9)',
    borderColor: 'rgba(225, 244, 50, 0.16)',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  points: {
    color: colors.accentInk,
    fontFamily: fonts.latinBold,
    fontWeight: '700',
    backgroundColor: 'rgba(225, 244, 50, 0.58)',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  row: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.86)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 62,
    padding: 12,
  },
});
