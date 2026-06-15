import { ExternalLink, TrendingDown, TrendingUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { WalletActivity } from '@/features/activity/types';
import { colors, radius } from '@/shared/theme/tokens';
import { ListRow } from '@/shared/ui/list-row';
import { formatTokenAmount } from '@/shared/utils/format';

type ActivityRowProps = {
  activity: WalletActivity;
};

export function ActivityRow({ activity }: ActivityRowProps) {
  const Icon = activity.direction === 'in' ? TrendingUp : TrendingDown;
  const isIncoming = activity.direction === 'in';

  return (
    <ListRow
      leading={
        <View style={[styles.icon, isIncoming ? styles.inIcon : styles.outIcon]}>
          <Icon color={isIncoming ? colors.success : colors.rose} size={18} />
        </View>
      }
      meta={activity.status}
      subtitle={activity.subtitle}
      title={activity.title}
      tone={isIncoming ? 'lime' : 'primary'}
      trailingIcon={<ExternalLink color={colors.textSubtle} size={16} />}
      value={`${isIncoming ? '+' : '-'}${formatTokenAmount(activity.amount)} ${activity.symbol}`}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inIcon: {
    backgroundColor: 'rgba(110, 231, 167, 0.12)',
  },
  outIcon: {
    backgroundColor: 'rgba(255, 107, 154, 0.12)',
  },
});
