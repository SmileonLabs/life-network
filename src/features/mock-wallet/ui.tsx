import { useState, type ComponentType, type ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
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
  ListChecks,
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
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type PressableProps,
  type GestureResponderEvent,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MockActivity, MockAsset, MockWallet } from '@/features/mock-wallet/data';
import { getKnownTokenByMint, getKnownTokenBySymbol } from '@/shared/config/token-registry';
import { colors, fonts } from '@/shared/theme/tokens';

const lifeNetworkMark = require('../../../assets/images/lns-mark.png');
const solanaTokenIcon = require('../../../assets/images/tokens/solana.png');

type Tone = 'primary' | 'muted' | 'subtle' | 'lime' | 'amber' | 'cyan' | 'danger';
type AppButtonTone = 'primary' | 'accent' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'glass';
type AppButtonShape = 'rounded' | 'pill';
type ActionRailTone = 'accent' | 'neutral' | 'danger';

const toneColor: Record<Tone, string> = {
  amber: colors.amber,
  cyan: colors.cyan,
  danger: colors.danger,
  lime: colors.lime,
  muted: colors.textMuted,
  primary: colors.text,
  subtle: colors.textSubtle,
};

const buttonLabelColor: Record<AppButtonTone, string> = {
  accent: colors.accentInk,
  danger: colors.danger,
  ghost: colors.text,
  glass: colors.white,
  primary: colors.accentInk,
  secondary: colors.text,
  soft: colors.accentInk,
};

type FeedbackTone = 'selection' | 'impact' | 'success' | 'warning' | 'error';

export function triggerNativeFeedback(tone: FeedbackTone = 'selection') {
  if (Platform.OS === 'web') {
    return;
  }

  const run =
    tone === 'impact'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : tone === 'success'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : tone === 'warning'
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          : tone === 'error'
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            : Haptics.selectionAsync();

  run.catch(() => undefined);
}

function withNativeFeedback(
  handler?: PressableProps['onPressIn'],
  tone: FeedbackTone = 'selection',
): PressableProps['onPressIn'] {
  return (event: GestureResponderEvent) => {
    triggerNativeFeedback(tone);
    handler?.(event);
  };
}

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
  onRefresh,
  refreshing = false,
  scroll = true,
  title,
}: {
  backHref?: Href;
  bottomNav?: boolean;
  children: ReactNode;
  fixedBottom?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardRoot}>
        <BrandBackdrop />
        <View style={styles.shell}>
          {scroll ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              decelerationRate="fast"
              keyboardShouldPersistTaps="handled"
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    colors={[colors.accent]}
                    onRefresh={onRefresh}
                    progressBackgroundColor={colors.backgroundElevated}
                    refreshing={refreshing}
                    tintColor={colors.accent}
                    titleColor={colors.textMuted}
                  />
                ) : undefined
              }
              showsVerticalScrollIndicator={false}>
              {body}
            </ScrollView>
          ) : (
            body
          )}
        </View>
        {fixedBottom ? <View style={[styles.fixedBottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>{fixedBottom}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function BrandBackdrop() {
  return (
    <View style={[styles.backgroundShade, styles.noPointerEvents]} />
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.wordmark}>
      <Image accessibilityIgnoresInvertColors source={lifeNetworkMark} style={[styles.wordmarkMark, compact && styles.wordmarkMarkCompact]} />
      <AppText variant="brand" style={[styles.wordmarkText, compact && styles.wordmarkTextCompact]}>
        LIFE Network
      </AppText>
    </View>
  );
}

export function TopBar({ backHref, right, title }: { backHref?: Href; right?: ReactNode; title: string }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        {backHref ? (
          <Link href={backHref} asChild>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={8}
              onPressIn={withNativeFeedback(undefined, 'selection')}
              style={styles.backButton}>
              <ChevronLeft color={toneColor.primary} size={21} />
            </Pressable>
          </Link>
        ) : null}
        <View>
          <AppText variant="title">{title}</AppText>
          <AppText tone="muted" variant="caption">
            LIFE Network
          </AppText>
        </View>
      </View>
      {right ?? <NetworkBadge />}
    </View>
  );
}

export function NetworkBadge({ label = 'Network' }: { label?: string }) {
  return (
    <View style={styles.networkBadge}>
      <View style={styles.networkDot} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

export function AppButton({
  children,
  contentStyle,
  fullWidth = false,
  icon,
  labelStyle,
  onPressIn,
  rightIcon,
  shape = 'rounded',
  size = 'large',
  style,
  tone = 'primary',
  ...props
}: PressableProps & {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  icon?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
  rightIcon?: ReactNode;
  shape?: AppButtonShape;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  tone?: AppButtonTone;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      onPressIn={withNativeFeedback(onPressIn, tone === 'primary' || tone === 'accent' ? 'impact' : 'selection')}
      style={[
        buttonStyles.base,
        buttonStyles[size],
        buttonStyles[tone],
        fullWidth && buttonStyles.fullWidth,
        shape === 'pill' && buttonStyles.pill,
        props.disabled && buttonStyles.disabled,
        style,
      ]}>
      <View style={[buttonStyles.content, Boolean(rightIcon) && buttonStyles.contentSpread, contentStyle]}>
        {icon}
        <AppText style={[buttonStyles.label, { color: buttonLabelColor[tone] }, labelStyle]} numberOfLines={1}>
          {children}
        </AppText>
        {rightIcon}
      </View>
    </Pressable>
  );
}

export function AppChip({
  active = false,
  children,
  labelStyle,
  ...props
}: Omit<PressableProps, 'children'> & {
  active?: boolean;
  children: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <AppButton
      {...props}
      labelStyle={[active && buttonStyles.chipActiveLabel, labelStyle]}
      shape="pill"
      size="small"
      tone={active ? 'soft' : 'secondary'}>
      {children}
    </AppButton>
  );
}

export function InlineActionButton({
  children,
  muted = false,
  ...props
}: Omit<PressableProps, 'children'> & { children: ReactNode; muted?: boolean }) {
  return (
    <AppButton labelStyle={muted && buttonStyles.mutedLabel} shape="pill" size="small" tone={muted ? 'secondary' : 'soft'} {...props}>
      {children}
    </AppButton>
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

export function AppSurface({
  children,
  compact = false,
  emphasis = 'default',
  style,
}: {
  children: ReactNode;
  compact?: boolean;
  emphasis?: 'default' | 'accent' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.surface,
        compact ? styles.surfaceCompact : styles.surfaceRegular,
        emphasis === 'accent' && styles.surfaceAccent,
        emphasis === 'warning' && styles.surfaceWarning,
        emphasis === 'danger' && styles.surfaceDanger,
        style,
      ]}>
      {children}
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
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              bottom: Platform.OS === 'android' ? insets.bottom : 0,
              maxHeight: height - insets.top - insets.bottom - 16,
              paddingBottom: Platform.OS === 'android' ? 20 : 20 + insets.bottom,
            },
          ]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <AppText variant="title">{title}</AppText>
            {onClose ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClose}
                onPressIn={withNativeFeedback(undefined, 'selection')}
                style={styles.iconButton}>
                <X color={toneColor.muted} size={18} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
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

export function TokenMark({
  asset,
  size = 42,
}: {
  asset: Pick<MockAsset, 'accent' | 'symbol'> & {
    address?: string;
    contractAddress?: string;
    iconUrl?: string;
  };
  size?: number;
}) {
  const [remoteFailed, setRemoteFailed] = useState(false);
  const normalizedSymbol = asset.symbol.toUpperCase();
  const knownToken = getKnownTokenByMint(101, asset.address ?? asset.contractAddress) ?? getKnownTokenByMint(103, asset.address ?? asset.contractAddress) ?? getKnownTokenBySymbol(asset.symbol);

  if (normalizedSymbol === 'LIFE') {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={lifeNetworkMark}
        style={[styles.tokenImage, { borderRadius: size / 2, height: size, width: size }]}
      />
    );
  }

  if (knownToken?.icon === 'usdc') {
    return (
      <View style={[styles.usdcTokenMark, { borderRadius: size / 2, height: size, width: size }]}>
        <CircleDollarSign color={colors.white} size={size * 0.58} strokeWidth={2.2} />
      </View>
    );
  }

  if (normalizedSymbol === 'SOL') {
    return (
      <View style={[styles.solTokenMark, { borderRadius: size / 2, height: size, width: size }]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={solanaTokenIcon}
          style={{ height: size * 0.66, width: size * 0.66 }}
        />
      </View>
    );
  }

  if (asset.iconUrl && isHttpUrl(asset.iconUrl) && !remoteFailed) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        onError={() => setRemoteFailed(true)}
        source={{ uri: asset.iconUrl }}
        style={[styles.remoteTokenImage, { borderColor: asset.accent, borderRadius: size / 2, height: size, width: size }]}
      />
    );
  }

  return (
    <View style={[styles.tokenMark, { borderColor: asset.accent, borderRadius: size / 2, height: size, width: size }]}>
      <AppText style={{ color: asset.accent }} variant="caption">
        {asset.symbol.slice(0, 1)}
      </AppText>
    </View>
  );
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={onPress ? withNativeFeedback(undefined, danger ? 'warning' : 'selection') : undefined}
      style={styles.settingsRow}>
      <View style={styles.settingsIcon}>{icon}</View>
      <View style={styles.settingsCopy}>
        <AppText numberOfLines={1} tone={danger ? 'danger' : 'primary'} style={styles.settingsTitle}>
          {title}
        </AppText>
      </View>
      {meta ? <View style={styles.settingsMeta}>{meta}</View> : null}
      {onPress ? <ChevronRight color={toneColor.subtle} size={18} /> : null}
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

export function ActionRail({ items }: { items: { href?: Href; icon: ReactNode; label: string; onPress?: () => void; tone?: ActionRailTone }[] }) {
  return (
    <View style={styles.actionRail}>
      {items.map((item) => {
        const actionTone = item.tone ?? 'neutral';
        const button = (
          <Pressable
            accessibilityRole="button"
            onPress={item.onPress}
            onPressIn={withNativeFeedback(undefined, item.label === 'Refresh' || item.label === 'Updating' ? 'selection' : 'impact')}
            style={styles.actionItem}>
            <View style={[styles.actionIcon, actionTone === 'accent' && styles.actionIconAccent, actionTone === 'danger' && styles.actionIconDanger]}>
              {item.icon}
            </View>
            <AppText tone={actionTone === 'danger' ? 'danger' : 'muted'} variant="caption" style={styles.actionLabel}>
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
  const interactive = Boolean(href || onPress);
  const content = (
    <Pressable
      accessibilityRole={interactive ? 'button' : undefined}
      disabled={!interactive}
      onPress={onPress}
      onPressIn={interactive ? withNativeFeedback(undefined, 'selection') : undefined}
      style={href ? styles.row : ({ pressed }) => [styles.row, interactive && pressed && styles.rowPressed]}>
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
  const pathname = usePathname() || '/';
  const items: { href: Href; icon: ComponentType<{ color?: string; size?: number }>; label: string }[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/missions', icon: ListChecks, label: 'Missions' },
    { href: '/tokens', icon: CircleDollarSign, label: 'Assets' },
    { href: '/profile', icon: UserRound, label: 'Profile' },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(String(item.href));
        const Icon = item.icon;
        return (
          <View key={item.label} style={styles.navSlot}>
            <Link href={item.href} asChild>
              <Pressable
                accessibilityRole="button"
                hitSlop={6}
                onPressIn={withNativeFeedback(undefined, 'selection')}
                style={StyleSheet.flatten([styles.navItem, active && styles.navItemActive])}>
                <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                  <Icon color={active ? colors.accentInk : toneColor.muted} size={18} />
                </View>
                <AppText tone="muted" variant="caption" style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </AppText>
              </Pressable>
            </Link>
          </View>
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
  ListChecks,
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
    fontFamily: fonts.regular,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
  },
  brand: {
    fontFamily: fonts.regular,
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 31,
  },
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  display: {
    fontFamily: fonts.light,
    fontSize: 44,
    fontWeight: '300',
    lineHeight: 52,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 28,
  },
});

const buttonStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accent: {
    backgroundColor: colors.accent,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    ...Platform.select({
      web: {
        boxShadow: '0 16px 34px rgba(225, 244, 50, 0.18)',
      },
      default: {
        elevation: 7,
        shadowColor: colors.accent,
        shadowOffset: { height: 12, width: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 22,
      },
    }),
  },
  chipActiveLabel: {
    color: colors.accentInk,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  contentSpread: {
    justifyContent: 'space-between',
    width: '100%',
  },
  danger: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.24)',
  },
  disabled: {
    opacity: 0.48,
  },
  fullWidth: {
    width: '100%',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  label: {
    fontFamily: fonts.latinBold,
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
    letterSpacing: 0,
    lineHeight: 18,
    minWidth: 0,
  },
  mutedLabel: {
    color: colors.textMuted,
  },
  large: {
    minHeight: 54,
    paddingHorizontal: 18,
  },
  medium: {
    minHeight: 46,
    paddingHorizontal: 14,
  },
  pill: {
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    ...Platform.select({
      web: {
        boxShadow: '0 16px 34px rgba(225, 244, 50, 0.18)',
      },
      default: {
        elevation: 7,
        shadowColor: colors.accent,
        shadowOffset: { height: 12, width: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 22,
      },
    }),
  },
  secondary: {
    backgroundColor: 'rgba(245, 241, 234, 0.92)',
    borderColor: colors.border,
  },
  small: {
    minHeight: 34,
    paddingHorizontal: 11,
  },
  soft: {
    backgroundColor: 'rgba(225, 244, 50, 0.28)',
    borderColor: 'rgba(225, 244, 50, 0.5)',
  },
});

const styles = StyleSheet.create({
  actionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.88)',
    borderColor: 'rgba(31, 27, 22, 0.09)',
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  actionIconAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 28px rgba(225, 244, 50, 0.2)',
      },
      default: {
        elevation: 5,
        shadowColor: colors.accent,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
      },
    }),
  },
  actionIconDanger: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.18)',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
  },
  actionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.975 }],
  },
  actionItemWrap: {
    flex: 1,
  },
  actionLabel: {
    includeFontPadding: false,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
  actionRail: {
    flexDirection: 'row',
    gap: 10,
  },
  activityIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  activityIn: {
    backgroundColor: 'rgba(199, 106, 60, 0.1)',
  },
  activityOut: {
    backgroundColor: 'rgba(226, 178, 67, 0.13)',
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
    backgroundColor: colors.background,
    flexDirection: 'row',
    minHeight: 66,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  content: {
    gap: 20,
    paddingBottom: 56,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  contentWithNav: {
    paddingBottom: 100,
    paddingTop: 84,
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
    borderRadius: 9,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconPressed: {
    backgroundColor: 'rgba(31, 27, 22, 0.08)',
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  input: {
    color: toneColor.primary,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    minHeight: 42,
    padding: 0,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  keyboardRoot: {
    flex: 1,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 58,
    minWidth: 0,
    width: '100%',
  },
  navItemActive: {
    backgroundColor: 'transparent',
  },
  navIconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  navIconWrapActive: {
    backgroundColor: colors.accent,
  },
  navLabel: {
    alignSelf: 'center',
    fontFamily: fonts.latinBold,
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
  navLabelActive: {
    color: colors.accentInk,
  },
  navPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  navSlot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  navWrap: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopColor: 'rgba(31, 27, 22, 0.1)',
    borderTopWidth: 1,
    bottom: 0,
    maxWidth: 760,
    position: 'absolute',
    width: '100%',
  },
  noPointerEvents: {
    pointerEvents: 'none',
  },
  networkBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(225, 244, 50, 0.18)',
    borderColor: 'rgba(225, 244, 50, 0.34)',
    borderRadius: 10,
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
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowPressed: {
    backgroundColor: colors.backgroundSoft,
    opacity: 0.9,
    transform: [{ scale: 0.992 }],
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
    backgroundColor: colors.backgroundSoft,
    flexShrink: 0,
    borderRadius: 9,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  settingsCopy: {
    flex: 1,
    minWidth: 0,
  },
  settingsMeta: {
    alignItems: 'flex-end',
    flexShrink: 0,
    justifyContent: 'center',
  },
  settingsRow: {
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 62,
    padding: 12,
  },
  settingsTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  sheet: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    bottom: 0,
    gap: 18,
    maxWidth: 760,
    padding: 20,
    position: 'absolute',
    width: '100%',
  },
  sheetBackdrop: {
    ...absoluteFill,
    backgroundColor: 'rgba(31, 27, 22, 0.42)',
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(31, 27, 22, 0.18)',
    borderRadius: 3,
    height: 4,
    width: 42,
  },
  sheetContent: {
    gap: 18,
    paddingTop: 2,
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
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusFailed: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.22)',
  },
  statusPending: {
    backgroundColor: 'rgba(226, 178, 67, 0.12)',
    borderColor: 'rgba(226, 178, 67, 0.25)',
  },
  statusSuccess: {
    backgroundColor: 'rgba(199, 106, 60, 0.08)',
    borderColor: 'rgba(199, 106, 60, 0.22)',
  },
  surface: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
  },
  surfaceAccent: {
    backgroundColor: 'rgba(244, 217, 198, 0.5)',
    borderColor: 'rgba(199, 106, 60, 0.26)',
  },
  surfaceCompact: {
    padding: 12,
  },
  surfaceDanger: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.22)',
  },
  surfaceRegular: {
    padding: 14,
  },
  surfaceWarning: {
    backgroundColor: 'rgba(226, 178, 67, 0.11)',
    borderColor: 'rgba(226, 178, 67, 0.24)',
  },
  tokenMark: {
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    justifyContent: 'center',
  },
  solTokenMark: {
    alignItems: 'center',
    backgroundColor: colors.black,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  remoteTokenImage: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
  },
  tokenImage: {
    borderRadius: 999,
  },
  usdcTokenMark: {
    alignItems: 'center',
    backgroundColor: '#2775CA',
    justifyContent: 'center',
    overflow: 'hidden',
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
  wordmark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  wordmarkMark: {
    height: 28,
    width: 28,
  },
  wordmarkMarkCompact: {
    height: 22,
    width: 22,
  },
  wordmarkText: {
    fontSize: 22,
    lineHeight: 28,
  },
  wordmarkTextCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 9,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  walletMark: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderRadius: 9,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  walletRow: {
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 66,
    padding: 12,
  },
  walletRowActive: {
    backgroundColor: 'rgba(225, 244, 50, 0.14)',
    borderColor: 'rgba(225, 244, 50, 0.34)',
  },
});
