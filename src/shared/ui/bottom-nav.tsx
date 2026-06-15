import { type ComponentType } from 'react';
import { type Href, Link, usePathname } from 'expo-router';
import {
  Activity,
  ArrowUpRight,
  CircleDollarSign,
  Home,
  UserRound,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type NavItem = {
  href: Href;
  label: string;
  icon: ComponentType<{ color?: string; size?: number }>;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/tokens', label: 'Assets', icon: CircleDollarSign },
  { href: '/send', label: 'Send', icon: ArrowUpRight },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/profile', label: 'Me', icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {navItems.map((item) => (
        <BottomNavButton active={isActivePath(pathname, item.href)} item={item} key={item.label} />
      ))}
    </View>
  );
}

function BottomNavButton({ active, item }: { active: boolean; item: NavItem }) {
  const Icon = item.icon;

  return (
    <Link href={item.href} asChild>
      <Pressable style={StyleSheet.flatten([styles.item, active && styles.itemActive])}>
        <Icon color={active ? colors.lime : colors.textMuted} size={20} />
        <AppText variant="caption" tone={active ? 'lime' : 'muted'} style={styles.label}>
          {item.label}
        </AppText>
      </Pressable>
    </Link>
  );
}

function isActivePath(pathname: string, href: Href) {
  if (typeof href !== 'string') {
    return false;
  }

  if (href === '/') {
    return pathname === '/';
  }

  return pathname.startsWith(href);
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(8, 17, 31, 0.94)',
    padding: spacing.sm,
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.lg,
  },
  itemActive: {
    borderWidth: 1,
    borderColor: 'rgba(184, 255, 92, 0.28)',
    backgroundColor: 'rgba(184, 255, 92, 0.11)',
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
});
