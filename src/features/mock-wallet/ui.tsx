import { type ComponentType, type ReactNode } from 'react';
import { type Href, Link, usePathname } from 'expo-router';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  EyeOff,
  Home,
  KeyRound,
  LockKeyhole,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react-native';
import {
  Image,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MockActivity, MockAsset, MockWallet } from '@/features/mock-wallet/data';
import { colors } from '@/shared/theme/tokens';

const bnbTokenIcon = require('../../../assets/images/tokens/bnb.png');

type Tone = 'primary' | 'muted' | 'subtle' | 'lime' | 'amber' | 'cyan' | 'danger';

const toneColor: Record<Tone, string> = {
  amber: '#F3BA2F',
  cyan: '#64D8FF',
  danger: '#FF6B6B',
  lime: '#C7FF3D',
  muted: '#A5AEC0',
  primary: '#F7FAFF',
  subtle: '#667085',
};

export function AppText({
  children,
  numberOfLines,
  style,
  tone = 'primary',
  variant = 'body',
}: {
  children: ReactNode;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  tone?: Tone;
  variant?: 'brand' | 'display' | 'title' | 'body' | 'caption' | 'mono';
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[textStyles.base, textStyles[variant], { color: toneColor[tone] }, style]}>
      {children}
    </Text>
  );
}

export function AppScreen({
  backHref,
  bottomNav = false,
  children,
  fixedBottom,
  scroll = true,
  title,
}: {
  backHref?: Href;
  bottomNav?: boolean;
  children: ReactNode;
  fixedBottom?: ReactNode;
  scroll?: boolean;
  title?: string;
}) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[styles.content, bottomNav && styles.contentWithNav, fixedBottom ? { paddingBottom: 108 + insets.bottom } : null]}>
      {title ? <TopBar title={title} backHref={backHref} /> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundShade} />
      <View style={styles.shell}>
        {scroll ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </View>
      {fixedBottom ? <View style={[styles.fixedBottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>{fixedBottom}</View> : null}
      {bottomNav ? (
        <View style={[styles.navWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <BottomNav />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function TopBar({ backHref, right, title }: { backHref?: Href; right?: ReactNode; title: string }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        {backHref ? (
          <Link href={backHref} asChild>
            <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={styles.backButton}>
              <ChevronLeft color={toneColor.primary} size={21} />
            </Pressable>
          </Link>
        ) : null}
        <View>
          <AppText variant="title">{title}</AppText>
          <AppText tone="muted" variant="caption">
            BNB Smart Chain
          </AppText>
        </View>
      </View>
      {right ?? <NetworkBadge />}
    </View>
  );
}

export function NetworkBadge({ label = 'BSC Testnet' }: { label?: string }) {
  return (
    <View style={styles.networkBadge}>
      <View style={styles.networkDot} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

export function AppButton({
  children,
  icon,
  size = 'large',
  style,
  tone = 'primary',
  ...props
}: PressableProps & {
  children: ReactNode;
  icon?: ReactNode;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [buttonStyles.base, buttonStyles[size], buttonStyles[tone], pressed && buttonStyles.pressed, style]}>
      <View style={buttonStyles.content}>
        {icon}
        <AppText tone={tone === 'primary' ? 'primary' : tone === 'danger' ? 'danger' : 'primary'} style={buttonStyles.label}>
          {children}
        </AppText>
      </View>
    </Pressable>
  );
}

export function AppInput({
  icon,
  inputStyle,
  style,
  ...props
}: TextInputProps & { icon?: ReactNode; inputStyle?: StyleProp<TextStyle>; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.inputWrap, style]}>
      {icon}
      <TextInput
        placeholderTextColor={toneColor.subtle}
        selectionColor={toneColor.lime}
        style={[styles.input, inputStyle]}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

export function FloatingBottomActions({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <View style={styles.floatingActions}>
      {secondary}
      {primary}
    </View>
  );
}

export function BottomSheet({
  children,
  onClose,
  title,
  visible,
}: {
  children: ReactNode;
  onClose?: () => void;
  title: string;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <AppText variant="title">{title}</AppText>
            {onClose ? (
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
                <X color={toneColor.muted} size={18} />
              </Pressable>
            ) : null}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function LargeBalanceHeader({
  left,
  right,
  subtitle = 'Total balance',
  value,
}: {
  left?: ReactNode;
  right?: ReactNode;
  subtitle?: string;
  value: string;
}) {
  return (
    <View style={styles.balanceHeader}>
      <View>
        <AppText tone="muted" variant="caption">
          {subtitle}
        </AppText>
        <AppText variant="display">{value}</AppText>
      </View>
      {right}
      {left ? <View style={styles.balanceSub}>{left}</View> : null}
    </View>
  );
}

export function StatusBadge({ status }: { status: 'Success' | 'Pending' | 'Failed' | string }) {
  const tone = status === 'Success' ? 'lime' : status === 'Pending' ? 'amber' : status === 'Failed' ? 'danger' : 'muted';
  return (
    <View style={[styles.statusBadge, tone === 'lime' && styles.statusSuccess, tone === 'amber' && styles.statusPending, tone === 'danger' && styles.statusFailed]}>
      <AppText tone={tone as Tone} variant="caption">
        {status}
      </AppText>
    </View>
  );
}

export function TokenMark({ asset, size = 42 }: { asset: Pick<MockAsset, 'accent' | 'symbol'>; size?: number }) {
  const isBnbAsset = asset.symbol === 'BNB' || asset.symbol === 'tBNB';

  if (isBnbAsset) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={bnbTokenIcon}
        style={[styles.tokenImage, { height: size, width: size }]}
      />
    );
  }

  return (
    <View style={[styles.tokenMark, { borderColor: asset.accent, height: size, width: size }]}>
      <AppText style={{ color: asset.accent }} variant="caption">
        {asset.symbol.slice(0, 1)}
      </AppText>
    </View>
  );
}

export function AssetListRow({ asset, href }: { asset: MockAsset; href?: Href }) {
  return (
    <Row
      href={href}
      leading={<TokenMark asset={asset} />}
      meta={`${asset.price} · ${asset.change}`}
      subtitle={`${asset.kind} · ${asset.balance} ${asset.symbol}`}
      title={asset.name}
      value={asset.fiatValue}
    />
  );
}

export function ActivityListRow({ activity, href }: { activity: MockActivity; href?: Href }) {
  const incoming = activity.direction === 'in';
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;

  return (
    <Row
      href={href}
      leading={
        <View style={[styles.activityIcon, incoming ? styles.activityIn : styles.activityOut]}>
          <Icon color={incoming ? toneColor.lime : toneColor.amber} size={18} />
        </View>
      }
      meta={<StatusBadge status={activity.status} />}
      subtitle={activity.subtitle}
      title={activity.title}
      value={activity.amount}
      valueTone={incoming ? 'lime' : 'primary'}
    />
  );
}

export function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <AppText tone="muted" variant="caption" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.sectionRows}>{children}</View>
    </View>
  );
}

export function SettingsRow({
  danger = false,
  icon,
  meta,
  onPress,
  title,
}: {
  danger?: boolean;
  icon: ReactNode;
  meta?: ReactNode;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.settingsRow}>
      <View style={styles.settingsIcon}>{icon}</View>
      <AppText tone={danger ? 'danger' : 'primary'} style={styles.settingsTitle}>
        {title}
      </AppText>
      {meta}
      <ChevronRight color={toneColor.subtle} size={18} />
    </Pressable>
  );
}

export function WalletRow({ active, wallet }: { active?: boolean; wallet: MockWallet }) {
  return (
    <View style={[styles.walletRow, active && styles.walletRowActive]}>
      <View style={styles.walletMark}>
        <Wallet color={active ? toneColor.lime : toneColor.muted} size={18} />
      </View>
      <View style={styles.rowCopy}>
        <AppText numberOfLines={1}>{wallet.label}</AppText>
        <AppText numberOfLines={1} tone="muted" variant="caption">
          {wallet.source} · {shortAddress(wallet.address)}
        </AppText>
      </View>
      {active ? <Check color={toneColor.lime} size={18} /> : null}
    </View>
  );
}

export function ActionRail({ items }: { items: { href?: Href; icon: ReactNode; label: string; onPress?: () => void }[] }) {
  return (
    <View style={styles.actionRail}>
      {items.map((item) => {
        const button = (
          <Pressable accessibilityRole="button" onPress={item.onPress} style={styles.actionItem}>
            <View style={styles.actionIcon}>{item.icon}</View>
            <AppText tone="muted" variant="caption" style={styles.actionLabel}>
              {item.label}
            </AppText>
          </Pressable>
        );

        if (item.href) {
          return (
            <Link href={item.href} asChild key={item.label}>
              {button}
            </Link>
          );
        }

        return (
          <View key={item.label} style={styles.actionItemWrap}>
            {button}
          </View>
        );
      })}
    </View>
  );
}

export function Row({
  href,
  leading,
  meta,
  onPress,
  subtitle,
  title,
  value,
  valueTone = 'primary',
}: {
  href?: Href;
  leading?: ReactNode;
  meta?: ReactNode;
  onPress?: () => void;
  subtitle?: string;
  title: string;
  value?: string;
  valueTone?: Tone;
}) {
  const content = (
    <Pressable accessibilityRole={href || onPress ? 'button' : undefined} disabled={!href && !onPress} onPress={onPress} style={styles.row}>
      {leading}
      <View style={styles.rowCopy}>
        <AppText numberOfLines={1}>{title}</AppText>
        {subtitle ? (
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.rowValue}>
        {value ? (
          <AppText numberOfLines={1} tone={valueTone}>
            {value}
          </AppText>
        ) : null}
        {typeof meta === 'string' ? (
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {meta}
          </AppText>
        ) : (
          meta
        )}
      </View>
      {href || onPress ? <ChevronRight color={toneColor.subtle} size={18} /> : null}
    </Pressable>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {content}
      </Link>
    );
  }

  return content;
}

export function BottomNav() {
  const pathname = usePathname();
  const items: { href: Href; icon: ComponentType<{ color?: string; size?: number }>; label: string }[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/tokens', icon: CircleDollarSign, label: 'Assets' },
    { href: '/activity', icon: Activity, label: 'Activity' },
    { href: '/profile', icon: UserRound, label: 'Profile' },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(String(item.href));
        const Icon = item.icon;
        return (
          <Link href={item.href} asChild key={item.label}>
            <Pressable accessibilityRole="button" style={styles.navItem}>
              <Icon color={active ? toneColor.lime : toneColor.muted} size={19} />
              <AppText tone={active ? 'lime' : 'muted'} variant="caption" style={styles.navLabel}>
                {item.label}
              </AppText>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

export const icons = {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  EyeOff,
  KeyRound,
  LockKeyhole,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Wallet,
};

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const absoluteFill: ViewStyle = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
};

const textStyles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  brand: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.4,
    lineHeight: 32,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  display: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 52,
  },
  mono: {
    fontFamily: Platform.select({ default: 'monospace', ios: 'Menlo' }),
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
});

const buttonStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  danger: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.32)',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  label: {
    fontWeight: '800',
  },
  large: {
    minHeight: 52,
    paddingHorizontal: 18,
  },
  medium: {
    minHeight: 44,
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.72,
  },
  primary: {
    backgroundColor: 'rgba(199, 255, 61, 0.16)',
    borderColor: 'rgba(199, 255, 61, 0.62)',
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
  },
  small: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
});

const styles = StyleSheet.create({
  actionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: '100%',
  },
  actionItem: {
    flex: 1,
    gap: 6,
  },
  actionItemWrap: {
    flex: 1,
  },
  actionLabel: {
    textAlign: 'center',
  },
  actionRail: {
    flexDirection: 'row',
    gap: 10,
  },
  activityIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  activityIn: {
    backgroundColor: 'rgba(199, 255, 61, 0.1)',
  },
  activityOut: {
    backgroundColor: 'rgba(243, 186, 47, 0.1)',
  },
  backgroundShade: {
    ...absoluteFill,
    backgroundColor: colors.background,
  },
  balanceHeader: {
    gap: 12,
    paddingBottom: 8,
    paddingTop: 20,
  },
  balanceSub: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomNav: {
    backgroundColor: 'rgba(8, 13, 27, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  content: {
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  contentWithNav: {
    paddingBottom: 104,
  },
  fixedBottom: {
    alignSelf: 'center',
    bottom: 0,
    maxWidth: 760,
    paddingHorizontal: 20,
    position: 'absolute',
    width: '100%',
  },
  floatingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  input: {
    color: toneColor.primary,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    minHeight: 42,
    padding: 0,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  navWrap: {
    alignSelf: 'center',
    bottom: 0,
    maxWidth: 760,
    paddingHorizontal: 20,
    position: 'absolute',
    width: '100%',
  },
  networkBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(243, 186, 47, 0.08)',
    borderColor: 'rgba(243, 186, 47, 0.26)',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  networkDot: {
    backgroundColor: toneColor.amber,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  row: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowValue: {
    alignItems: 'flex-end',
    gap: 3,
    maxWidth: '40%',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    gap: 8,
  },
  sectionRows: {
    gap: 8,
  },
  sectionTitle: {
    paddingHorizontal: 4,
  },
  settingsIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  settingsRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 62,
    padding: 12,
  },
  settingsTitle: {
    flex: 1,
  },
  sheet: {
    alignSelf: 'center',
    backgroundColor: 'rgba(11, 18, 34, 0.98)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    bottom: 0,
    gap: 18,
    maxWidth: 760,
    padding: 20,
    paddingBottom: 28,
    position: 'absolute',
    width: '100%',
  },
  sheetBackdrop: {
    ...absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 3,
    height: 4,
    width: 42,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetOverlay: {
    ...absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  shell: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 760,
    width: '100%',
  },
  statusBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusFailed: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.22)',
  },
  statusPending: {
    backgroundColor: 'rgba(243, 186, 47, 0.08)',
    borderColor: 'rgba(243, 186, 47, 0.22)',
  },
  statusSuccess: {
    backgroundColor: 'rgba(199, 255, 61, 0.08)',
    borderColor: 'rgba(199, 255, 61, 0.22)',
  },
  tokenMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
  },
  tokenImage: {
    borderRadius: 999,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  topBarLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  walletMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  walletRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 66,
    padding: 12,
  },
  walletRowActive: {
    backgroundColor: 'rgba(199, 255, 61, 0.07)',
    borderColor: 'rgba(199, 255, 61, 0.28)',
  },
});
