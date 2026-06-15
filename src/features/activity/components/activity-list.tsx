import { StyleSheet, View } from 'react-native';

import type { WalletActivity } from '@/features/activity/types';
import { colors, spacing } from '@/shared/theme/tokens';
import { ActivityListRow } from '@/shared/ui/activity-list-row';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';

type ActivityListProps = {
  activities: WalletActivity[];
  title?: string;
};

export function ActivityList({ activities, title = 'Recent activity' }: ActivityListProps) {
  const groups = groupActivitiesByDate(activities);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <AppText variant="subtitle">{title}</AppText>
          <AppText variant="caption" tone="muted">
            {activities.length} confirmed items
          </AppText>
        </View>
        <Badge label="BscScan ready" tone="violet" />
      </View>
      <View style={styles.list}>
        {groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <AppText variant="caption" tone="subtle">
              {group.label}
            </AppText>
            {group.items.map((activity) => (
              <ActivityListRow activity={activity} key={activity.id} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function groupActivitiesByDate(activities: WalletActivity[]) {
  return activities.reduce<{ label: string; items: WalletActivity[] }[]>((groups, activity) => {
    const label = getDateLabel(activity.timestamp);
    const existingGroup = groups.find((group) => group.label === label);

    if (existingGroup) {
      existingGroup.items.push(activity);
      return groups;
    }

    return [...groups, { label, items: [activity] }];
  }, []);
}

function getDateLabel(timestamp: string) {
  const activityDate = new Date(timestamp);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

  if (activityDate.toDateString() === today) {
    return 'Today';
  }

  if (activityDate.toDateString() === yesterday) {
    return 'Yesterday';
  }

  return activityDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  titleGroup: {
    gap: 2,
  },
  list: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  group: {
    gap: spacing.sm,
  },
});
