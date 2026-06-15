import { useMemo, useState } from 'react';
import { Search } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import type { AssetBalance } from '@/features/tokens/types';
import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';
import { AssetListRow } from '@/shared/ui/asset-list-row';
import { SegmentedControl } from '@/shared/ui/segmented-control';

type TokenListProps = {
  title: string;
  assets: AssetBalance[];
  showDiscovery?: boolean;
};

type TokenFilter = 'all' | 'core' | 'discovered';

export function TokenList({ title, assets, showDiscovery = false }: TokenListProps) {
  const [filter, setFilter] = useState<TokenFilter>('all');
  const [query, setQuery] = useState('');
  const filteredAssets = useMemo(() => {
    const filteredByType = !showDiscovery || filter === 'all'
      ? assets
      : filter === 'core'
        ? assets.filter((asset) => asset.discoveredBy === 'core')
        : assets.filter((asset) => asset.discoveredBy !== 'core');

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return filteredByType;
    }

    return filteredByType.filter(
      (asset) =>
        asset.name.toLowerCase().includes(normalizedQuery) ||
        asset.symbol.toLowerCase().includes(normalizedQuery),
    );
  }, [assets, filter, query, showDiscovery]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <AppText variant="subtitle">{title}</AppText>
          <AppText variant="caption" tone="muted">
            {assets.length} assets tracked
          </AppText>
        </View>
        {showDiscovery && <Badge label="Explorer synced" tone="cyan" />}
      </View>
      {showDiscovery && (
        <>
          <View style={styles.searchBox}>
            <Search color={colors.textSubtle} size={17} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder="Search tokens"
              placeholderTextColor={colors.textSubtle}
              style={styles.searchInput}
              value={query}
            />
          </View>
          <SegmentedControl<TokenFilter>
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Core', value: 'core' },
              { label: 'Discovered', value: 'discovered' },
            ]}
            value={filter}
          />
        </>
      )}
      <View style={styles.list}>
        {filteredAssets.map((asset) => (
          <AssetListRow asset={asset} key={asset.id} label={asset.discoveredBy === 'core' ? 'Pinned' : 'Detected'} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  titleGroup: {
    gap: 2,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
