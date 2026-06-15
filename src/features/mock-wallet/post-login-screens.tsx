import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Bell,
  Check,
  ChevronRight,
  Copy,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Plus,
  QrCode,
  Repeat2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { mockActivities, mockAddress, mockAssets, mockWallets, totalValue, type MockActivity } from '@/features/mock-wallet/data';
import {
  ActionRail,
  ActivityListRow,
  AppButton,
  AppInput,
  AppScreen,
  AppText,
  AssetListRow,
  BottomSheet,
  LargeBalanceHeader,
  NetworkBadge,
  Row,
  SettingsRow,
  SettingsSection,
  StatusBadge,
  TokenMark,
  WalletRow,
  shortAddress,
} from '@/features/mock-wallet/ui';

export function HomeScreen() {
  const life = mockAssets[0];
  const bnb = mockAssets[1];

  return (
    <AppScreen bottomNav>
      <View style={styles.homeHeader}>
        <View>
          <AppText variant="caption" tone="muted">
            LIFE NETWORK
          </AppText>
          <AppText variant="title">Wallet</AppText>
        </View>
        <NetworkBadge />
      </View>

      <LargeBalanceHeader
        value={totalValue}
        left={
          <>
            <MiniBalance label="LIFE" value={life.balance} />
            <MiniBalance label="BNB gas" value={bnb.balance} />
          </>
        }
      />

      <ActionRail
        items={[
          { href: '/send', icon: <ArrowUpRight color="#C7FF3D" size={19} />, label: 'Send' },
          { href: '/receive', icon: <ArrowDownLeft color="#C7FF3D" size={19} />, label: 'Receive' },
          { icon: <Repeat2 color="#A5AEC0" size={19} />, label: 'Swap' },
          { icon: <Plus color="#A5AEC0" size={19} />, label: 'Buy' },
        ]}
      />

      <View style={styles.sectionBlock}>
        <SectionHeader actionHref="/tokens" actionLabel="Manage" title="Assets" />
        {mockAssets.slice(0, 3).map((asset) => (
          <AssetListRow asset={asset} href={{ pathname: '/tokens/[address]', params: { address: asset.address } }} key={asset.address} />
        ))}
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader actionHref="/activity" actionLabel="All" title="Recent activity" />
        {mockActivities.slice(0, 2).map((activity) => (
          <ActivityListRow activity={activity} key={`${activity.title}-${activity.amount}`} />
        ))}
      </View>
    </AppScreen>
  );
}

export function AssetsScreen() {
  return (
    <AppScreen bottomNav title="Assets">
      <AppInput icon={<Search color="#667085" size={18} />} placeholder="Search assets" />
      <View style={styles.assetPin}>
        <View style={styles.assetPinTop}>
          <TokenMark asset={mockAssets[0]} size={48} />
          <View style={styles.assetPinCopy}>
            <AppText>LIFE</AppText>
            <AppText tone="muted" variant="caption">
              Core asset
            </AppText>
          </View>
          <View style={styles.assetPinValue}>
            <AppText>{mockAssets[0].fiatValue}</AppText>
            <AppText tone="lime" variant="caption">
              {mockAssets[0].change}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.sectionBlock}>
        <SectionHeader actionLabel="Filter" actionIcon={<SlidersHorizontal color="#A5AEC0" size={15} />} title="BSC assets" />
        {mockAssets.map((asset) => (
          <AssetListRow asset={asset} href={{ pathname: '/tokens/[address]', params: { address: asset.address } }} key={asset.address} />
        ))}
      </View>
    </AppScreen>
  );
}

export function AssetDetailScreen() {
  const params = useLocalSearchParams<{ address?: string }>();
  const asset = mockAssets.find((item) => item.address === params.address) ?? mockAssets[0];
  const tokenActivity = mockActivities.filter((activity) => activity.asset === asset.symbol || asset.symbol === 'LIFE');

  return (
    <AppScreen bottomNav backHref="/tokens">
      <View style={styles.assetDetailHead}>
        <TokenMark asset={asset} size={54} />
        <View style={styles.assetDetailCopy}>
          <AppText variant="title">{asset.name}</AppText>
          <AppText tone="muted" variant="caption">
            {asset.kind} · BNB Smart Chain
          </AppText>
        </View>
      </View>

      <LargeBalanceHeader subtitle={`${asset.symbol} balance`} value={asset.fiatValue} left={<MiniBalance label={asset.symbol} value={asset.balance} />} />

      <ActionRail
        items={[
          { href: '/send', icon: <ArrowUpRight color="#C7FF3D" size={19} />, label: 'Send' },
          { href: '/receive', icon: <ArrowDownLeft color="#C7FF3D" size={19} />, label: 'Receive' },
        ]}
      />

      <View style={styles.infoCard}>
        <InfoLine label="Price" value={asset.price} />
        <InfoLine label="24h" tone={asset.change.startsWith('-') ? 'danger' : 'lime'} value={asset.change} />
        <InfoLine label="Network" value="BSC" />
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader title="Activity" />
        {tokenActivity.slice(0, 4).map((activity) => (
          <ActivityListRow activity={activity} key={`${asset.address}-${activity.title}-${activity.amount}`} />
        ))}
      </View>
    </AppScreen>
  );
}

export function SendScreen() {
  const [reviewVisible, setReviewVisible] = useState(false);
  const [sentVisible, setSentVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const selected = mockAssets[0];
  const displayAmount = amount.trim() || '0';
  const amountNumber = Number(displayAmount.replace(/,/g, ''));
  const fiatAmount = Number.isFinite(amountNumber)
    ? `$${(amountNumber * 0.49).toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`
    : '$0.00';
  const onAmountChange = (value: string) => {
    setAmount(value.replace(/[^0-9.]/g, ''));
  };

  return (
    <AppScreen
      backHref="/"
      title="Send"
      fixedBottom={
        <AppButton style={styles.fullFlex} onPress={() => setReviewVisible(true)}>
          Review
        </AppButton>
      }>
      <View style={styles.formStack}>
        <AppText tone="muted" variant="caption">
          Asset
        </AppText>
        <Row leading={<TokenMark asset={selected} />} title={selected.name} subtitle={`${selected.balance} ${selected.symbol} available`} value={selected.fiatValue} />
      </View>

      <View style={styles.formStack}>
        <AppText tone="muted" variant="caption">
          Recipient
        </AppText>
        <AppInput placeholder="0x address or BSC name" />
      </View>

      <View style={styles.amountPanel}>
        <AppText tone="muted" variant="caption">
          Amount
        </AppText>
        <AppInput
          inputMode="decimal"
          keyboardType="decimal-pad"
          onChangeText={onAmountChange}
          placeholder="0"
          value={amount}
          inputStyle={styles.amountInputText}
          style={styles.amountInput}
        />
        <AppText tone="muted">LIFE · {fiatAmount}</AppText>
      </View>

      <View style={styles.infoCard}>
        <InfoLine label="Estimated gas" value="0.00042 BNB" />
        <InfoLine label="Network" value="BNB Smart Chain" />
        <InfoLine label="Risk check" tone="lime" value="No warning" />
      </View>

      <BottomSheet title="Review send" visible={reviewVisible} onClose={() => setReviewVisible(false)}>
        <View style={styles.reviewHero}>
          <ArrowUpRight color="#C7FF3D" size={22} />
          <View style={styles.reviewHeroCopy}>
            <AppText>{displayAmount} LIFE</AppText>
            <AppText tone="muted" variant="caption">
              To 0x62A1...92C0
            </AppText>
          </View>
        </View>
        <View style={styles.infoCardCompact}>
          <InfoLine label="You send" value={`${displayAmount} LIFE`} />
          <InfoLine label="Gas" value="0.00042 BNB" />
          <InfoLine label="Result" value={`Recipient receives ${displayAmount} LIFE`} />
        </View>
        <AppButton
          onPress={() => {
            setReviewVisible(false);
            setSentVisible(true);
          }}>
          Confirm Send
        </AppButton>
      </BottomSheet>

      <BottomSheet title="Transfer submitted" visible={sentVisible} onClose={() => setSentVisible(false)}>
        <CompletionNotice label={`${displayAmount} LIFE`} subtitle="Pending on BNB Smart Chain" />
        <AppButton onPress={() => setSentVisible(false)}>Done</AppButton>
      </BottomSheet>
    </AppScreen>
  );
}

export function ReceiveScreen() {
  return (
    <AppScreen title="Receive" backHref="/">
      <View style={styles.receiveCard}>
        <View style={styles.qrWrap}>
          <QRCode backgroundColor="transparent" color="#F7FAFF" size={190} value={mockAddress} />
        </View>
        <AppText variant="caption" tone="amber">
          BSC only
        </AppText>
        <AppText variant="mono" style={styles.addressText}>
          {mockAddress}
        </AppText>
      </View>

      <ActionRail
        items={[
          { icon: <Copy color="#C7FF3D" size={19} />, label: 'Copy' },
          { icon: <QrCode color="#A5AEC0" size={19} />, label: 'Share' },
        ]}
      />

      <View style={styles.warningPanel}>
        <AlertTriangle color="#F3BA2F" size={18} />
        <AppText tone="muted">Only send BNB Smart Chain assets to this address.</AppText>
      </View>
    </AppScreen>
  );
}

export function ActivityScreen() {
  const groups = useMemo(() => groupActivities(mockActivities), []);

  return (
    <AppScreen bottomNav title="Activity">
      <View style={styles.filterRow}>
        <StatusBadge status="All networks" />
        <StatusBadge status="BSC" />
      </View>
      {groups.map((group) => (
        <View style={styles.sectionBlock} key={group.date}>
          <SectionHeader title={group.date} />
          {group.items.map((activity) => (
            <ActivityListRow activity={activity} key={`${group.date}-${activity.title}-${activity.amount}`} />
          ))}
        </View>
      ))}
    </AppScreen>
  );
}

export function ProfileScreen() {
  const router = useRouter();

  return (
    <AppScreen bottomNav title="Me">
      <View style={styles.profileCard}>
        <View style={styles.profileMark}>
          <Wallet color="#C7FF3D" size={22} />
        </View>
        <View style={styles.profileCopy}>
          <AppText>LIFE Main Wallet</AppText>
          <AppText tone="muted" variant="caption">
            {shortAddress(mockAddress)}
          </AppText>
        </View>
      </View>

      <SettingsSection title="Wallets">
        {mockWallets.map((wallet, index) => (
          <WalletRow wallet={wallet} active={index === 0} key={wallet.address} />
        ))}
        <SettingsRow icon={<Plus color="#A5AEC0" size={18} />} title="Import wallet" />
      </SettingsSection>

      <SettingsSection title="Security">
        <SettingsRow icon={<ShieldCheck color="#C7FF3D" size={18} />} title="Security center" onPress={() => router.push('/security')} />
        <SettingsRow icon={<LockKeyhole color="#A5AEC0" size={18} />} title="Password" />
        <SettingsRow icon={<EyeOff color="#A5AEC0" size={18} />} title="Recovery phrase" />
      </SettingsSection>

      <SettingsSection title="Connections">
        <SettingsRow icon={<Ban color="#A5AEC0" size={18} />} title="Connected dApps" meta={<StatusBadge status="0 active" />} />
        <SettingsRow icon={<Bell color="#A5AEC0" size={18} />} title="Notifications" />
      </SettingsSection>
    </AppScreen>
  );
}

export function SecurityScreen() {
  return (
    <AppScreen title="Security" backHref="/profile">
      <View style={styles.securityStatus}>
        <ShieldCheck color="#C7FF3D" size={24} />
        <View style={styles.securityCopy}>
          <AppText>Password enabled</AppText>
          <AppText tone="muted" variant="caption">
            Sensitive values are hidden in this demo.
          </AppText>
        </View>
      </View>

      <SettingsSection title="Access">
        <SettingsRow icon={<LockKeyhole color="#C7FF3D" size={18} />} title="Change password" />
        <SettingsRow icon={<KeyRound color="#A5AEC0" size={18} />} title="Recovery phrase" />
      </SettingsSection>

      <SettingsSection title="On-chain safety">
        <SettingsRow icon={<ShieldCheck color="#A5AEC0" size={18} />} title="Token approvals" meta={<StatusBadge status="Preview" />} />
        <SettingsRow icon={<Ban color="#A5AEC0" size={18} />} title="Connected dApps" meta={<StatusBadge status="None" />} />
      </SettingsSection>

      <View style={styles.warningPanel}>
        <AlertTriangle color="#F3BA2F" size={18} />
        <AppText tone="muted">Seed phrases and private keys are never shown in logs or cached UI state.</AppText>
      </View>
    </AppScreen>
  );
}

function MiniBalance({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniBalance}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

function SectionHeader({
  actionHref,
  actionIcon,
  actionLabel,
  title,
}: {
  actionHref?: Href;
  actionIcon?: ReactNode;
  actionLabel?: string;
  title: string;
}) {
  const content = actionLabel ? (
    <View style={styles.sectionAction}>
      {actionIcon}
      <AppText tone="muted" variant="caption">
        {actionLabel}
      </AppText>
      {actionHref ? <ChevronRight color="#667085" size={14} /> : null}
    </View>
  ) : null;

  return (
    <View style={styles.sectionHeader}>
      <AppText variant="title" style={styles.sectionHeaderTitle}>
        {title}
      </AppText>
      {actionHref && content ? (
        <Link href={actionHref} asChild>
          <Pressable accessibilityRole="button">{content}</Pressable>
        </Link>
      ) : (
        content
      )}
    </View>
  );
}

function InfoLine({ label, tone = 'primary', value }: { label: string; tone?: 'primary' | 'lime' | 'danger' | 'amber'; value: string }) {
  return (
    <View style={styles.infoLine}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText tone={tone}>{value}</AppText>
    </View>
  );
}

function CompletionNotice({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <View style={styles.completionNotice}>
      <View style={styles.noticeMark}>
        <Check color="#C7FF3D" size={22} />
      </View>
      <View style={styles.noticeCopy}>
        <AppText>{label}</AppText>
        <AppText tone="muted" variant="caption">
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

function groupActivities(items: MockActivity[]) {
  return items.reduce<{ date: string; items: MockActivity[] }[]>((groups, item) => {
    const current = groups.find((group) => group.date === item.date);
    if (current) {
      current.items.push(item);
    } else {
      groups.push({ date: item.date, items: [item] });
    }
    return groups;
  }, []);
}

const styles = StyleSheet.create({
  addressText: {
    textAlign: 'center',
  },
  amountPanel: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 18,
  },
  amountInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    minHeight: 58,
    paddingHorizontal: 0,
  },
  amountInputText: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 52,
  },
  assetDetailCopy: {
    flex: 1,
    gap: 2,
  },
  assetDetailHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingTop: 10,
  },
  assetPin: {
    backgroundColor: 'rgba(199, 255, 61, 0.06)',
    borderColor: 'rgba(199, 255, 61, 0.22)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  assetPinCopy: {
    flex: 1,
    gap: 2,
  },
  assetPinTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  assetPinValue: {
    alignItems: 'flex-end',
  },
  completionNotice: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formStack: {
    gap: 9,
  },
  fullFlex: {
    flex: 1,
  },
  homeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  infoCardCompact: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  infoLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  miniBalance: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 12,
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(199,255,61,0.08)',
    borderColor: 'rgba(199,255,61,0.22)',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(199,255,61,0.08)',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  qrWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
  },
  receiveCard: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
  },
  reviewHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  reviewHeroCopy: {
    flex: 1,
    gap: 2,
  },
  sectionAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  securityCopy: {
    flex: 1,
    gap: 2,
  },
  securityStatus: {
    alignItems: 'center',
    backgroundColor: 'rgba(199,255,61,0.06)',
    borderColor: 'rgba(199,255,61,0.18)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  warningPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(243,186,47,0.06)',
    borderColor: 'rgba(243,186,47,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
});
