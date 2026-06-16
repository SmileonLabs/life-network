import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  LogOut,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import type { WalletActivity } from '@/features/activity/types';
import { mockAssets, type MockActivity, type MockAsset, type MockWallet } from '@/features/mock-wallet/data';
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
  SettingsRow,
  SettingsSection,
  StatusBadge,
  TokenMark,
  WalletRow,
} from '@/features/mock-wallet/ui';
import type { AssetBalance } from '@/features/tokens/types';
import { getGasReserveBnb } from '@/features/transfer/types';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import type { WalletAccount } from '@/features/wallet/types';
import { supportedChains, type SupportedChainId } from '@/shared/config/chains';
import { extractAddressFromText, extractTransactionHashFromText, isAddress, isSameAddress, isTransactionHash } from '@/shared/utils/address';
import { formatCurrency, formatPercent, formatTokenAmount, shortAddress } from '@/shared/utils/format';

const toMockAsset = (asset: AssetBalance): MockAsset => {
  const value = asset.balance * asset.priceUsd;

  return {
    accent: asset.accent,
    address: asset.type === 'native' ? 'native' : asset.contractAddress ?? asset.id,
    balance: formatTokenAmount(asset.balance, asset.type === 'native' ? 6 : 2),
    change: formatPercent(asset.change24h),
    fiatValue: formatCurrency(value),
    kind: asset.type === 'native' ? 'Gas' : asset.symbol === 'LIFE' ? 'Core' : 'BEP-20',
    name: asset.name,
    price: asset.priceUsd > 0 ? formatCurrency(asset.priceUsd) : '$0.00',
    symbol: asset.symbol,
  };
};

const toMockActivity = (activity: WalletActivity): MockActivity => {
  const incoming = activity.direction === 'in';
  const amountPrefix = activity.amount > 0 ? (incoming ? '+' : '-') : '';

  return {
    amount: `${amountPrefix}${formatTokenAmount(activity.amount, activity.amount < 1 ? 6 : 2)} ${activity.symbol}`,
    asset: activity.symbol,
    date: formatActivityDate(activity.timestamp),
    direction: activity.direction,
    hash: activity.hash,
    status: activity.status === 'success' ? 'Success' : activity.status === 'pending' ? 'Pending' : 'Failed',
    subtitle: activity.subtitle,
    title: activity.title,
  };
};

const toMockWallet = (wallet: WalletAccount): MockWallet => ({
  address: wallet.address,
  label: wallet.label,
  source: 'Main',
});

const normalizeAssetAddress = (address?: string) => address?.trim().toLowerCase() ?? '';

const matchesAssetParam = (asset: AssetBalance, value?: string) => {
  if (!value) {
    return false;
  }

  return asset.id === value || (asset.type === 'native' && value === 'native') || normalizeAssetAddress(asset.contractAddress) === normalizeAssetAddress(value);
};

const matchesActivityAsset = (activity: WalletActivity, asset: AssetBalance) => {
  if (activity.chainId !== asset.chainId) {
    return false;
  }

  if (activity.assetId && activity.assetId === asset.id) {
    return true;
  }

  if (asset.type === 'bep20') {
    return Boolean(asset.contractAddress && activity.contractAddress && isSameAddress(asset.contractAddress, activity.contractAddress));
  }

  return !activity.contractAddress && activity.symbol === asset.symbol;
};

const findAssetForActivity = (assets: AssetBalance[], activity: WalletActivity, nativeSymbol: string) =>
  assets.find((asset) => asset.chainId === activity.chainId && activity.assetId === asset.id) ??
  assets.find((asset) => asset.chainId === activity.chainId && asset.contractAddress && activity.contractAddress && isSameAddress(asset.contractAddress, activity.contractAddress)) ??
  assets.find((asset) => asset.chainId === activity.chainId && asset.type === 'native' && !activity.contractAddress && activity.symbol === nativeSymbol);

const getRouteParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

const sanitizeAmountInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole = '', ...fractions] = cleaned.split('.');
  return fractions.length > 0 ? `${whole}.${fractions.join('')}` : whole;
};

const sanitizeAddressInput = (value: string) => extractAddressFromText(value) ?? value.trim();
const sanitizeHashInput = (value: string) => extractTransactionHashFromText(value) ?? value.trim();

const getRecipientStatusLabel = (kind: 'account' | 'contract' | 'unknown', recipient: string) => {
  if (!recipient.trim()) {
    return 'Not set';
  }

  if (kind === 'contract') {
    return 'Contract';
  }

  if (kind === 'account') {
    return 'Wallet';
  }

  return 'Unverified';
};

const getSendErrorMessage = (error: unknown) => {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (code === 4001 || normalized.includes('user rejected') || normalized.includes('user denied') || normalized.includes('cancel')) {
    return 'Transaction cancelled.';
  }

  if (code === 4100 || normalized.includes('unauthorized')) {
    return 'Wallet session is not authorized.';
  }

  if (code === 4902 || normalized.includes('unrecognized chain') || normalized.includes('switch wallet')) {
    return 'Check the selected network and try again.';
  }

  if (code === -32000 || normalized.includes('insufficient funds') || normalized.includes('insufficient balance')) {
    return 'Insufficient balance for this transfer.';
  }

  if (normalized.includes('gas') && normalized.includes('fund')) {
    return 'Insufficient gas for this transfer.';
  }

  if (normalized.includes('rejected this transfer') || normalized.includes('revert') || normalized.includes('simulation failed')) {
    return 'Token contract rejected this transfer.';
  }

  if (normalized.includes('network') || normalized.includes('chain') || normalized.includes('rpc') || normalized.includes('timeout')) {
    return 'Network request failed. Try again.';
  }

  if (isSafeUserFacingError(message)) {
    return sanitizeErrorMessage(message);
  }

  return 'Transfer failed.';
};

function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;

  if (typeof code === 'number') {
    return code;
  }

  if (typeof code === 'string') {
    const parsedCode = Number(code);
    return Number.isFinite(parsedCode) ? parsedCode : null;
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const nestedError = error as {
      data?: { message?: unknown };
      details?: unknown;
      message?: unknown;
      shortMessage?: unknown;
    };

    return [nestedError.shortMessage, nestedError.message, nestedError.data?.message, nestedError.details]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(' ');
  }

  return typeof error === 'string' ? error : '';
}

function isSafeUserFacingError(message: string) {
  const normalized = message.toLowerCase();

  if (!message.trim()) {
    return false;
  }

  return !(
    normalized.includes('0x') ||
    normalized.includes('raw transaction') ||
    normalized.includes('calldata') ||
    normalized.includes('stack') ||
    normalized.includes('json-rpc') ||
    message.length > 160
  );
}

function sanitizeErrorMessage(message: string) {
  return message.replace(/\s+/g, ' ').trim().split('\n')[0] ?? 'Transfer failed.';
}

const getSyncNotice = (refreshError: string | null, area: 'assets' | 'activity' | 'home') => {
  if (!refreshError) {
    return null;
  }

  const unavailable = refreshError.includes('unavailable');
  const delayed = refreshError.includes('delayed');

  if (area === 'assets') {
    if (unavailable) {
      return 'Token discovery is unavailable. RPC balances are still available.';
    }

    return delayed ? 'Token discovery is delayed. RPC balances are still available.' : 'Token discovery is limited. RPC balances are still available.';
  }

  if (area === 'activity') {
    if (unavailable) {
      return 'Explorer history is unavailable. New app transactions still appear here.';
    }

    return delayed ? 'Explorer history is delayed. New app transactions still appear here.' : 'Explorer history is limited. New app transactions still appear here.';
  }

  if (unavailable) {
    return 'Explorer unavailable';
  }

  return delayed ? 'Sync delayed' : 'Sync limited';
};

const selectableChains = [supportedChains[97], supportedChains[56]];
const activityFilters = [
  { label: 'All', value: 'all' },
  { label: 'In', value: 'in' },
  { label: 'Out', value: 'out' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
] as const;

type ActivityFilterValue = (typeof activityFilters)[number]['value'];

export function HomeScreen() {
  const { activeWallet, activities, assets, chainId, isRefreshing, lifeAsset, nativeAsset, refreshError, refreshWallet } = useWallet();
  const chain = supportedChains[chainId];
  const homeSyncNotice = getSyncNotice(refreshError, 'home');
  const assetRows = assets.slice(0, 3).map(toMockAsset);
  const recentActivities = activities.slice(0, 2).map(toMockActivity);
  const needsTestGas = Boolean(chain.faucetUrl && (nativeAsset?.balance ?? 0) <= 0);
  const openFaucet = () => {
    if (chain.faucetUrl) {
      Linking.openURL(chain.faucetUrl);
    }
  };

  return (
    <AppScreen bottomNav>
      <View style={styles.homeHeader}>
        <View>
          <AppText variant="caption" tone="muted">
            LIFE NETWORK
          </AppText>
          <AppText variant="title">Wallet</AppText>
        </View>
        <NetworkBadge label={chain.shortName} />
      </View>

      <LargeBalanceHeader
        subtitle={`${chain.nativeCurrency.symbol} gas balance`}
        value={`${formatTokenAmount(nativeAsset?.balance ?? 0, 6)} ${nativeAsset?.symbol ?? chain.nativeCurrency.symbol}`}
        left={
          <>
            <MiniBalance label="LIFE" value={formatTokenAmount(lifeAsset?.balance ?? 0, 2)} />
            <MiniBalance label={`${chain.nativeCurrency.symbol} gas`} value={formatTokenAmount(nativeAsset?.balance ?? 0, 6)} />
          </>
        }
      />

      <View style={styles.infoCardCompact}>
        <InfoLine label="Network" tone="amber" value={chain.shortName} />
        <InfoLine label="Wallet" tone={activeWallet ? 'lime' : 'amber'} value={activeWallet ? shortAddress(activeWallet.address, 8, 6) : 'Creating wallet'} />
        <InfoLine label="Sync" tone={homeSyncNotice ? 'amber' : isRefreshing ? 'amber' : 'lime'} value={homeSyncNotice ?? (isRefreshing ? 'Updating' : 'Ready')} />
      </View>

      <ActionRail
        items={[
          { href: '/send', icon: <ArrowUpRight color="#C7FF3D" size={19} />, label: 'Send' },
          { href: '/receive', icon: <ArrowDownLeft color="#C7FF3D" size={19} />, label: 'Receive' },
          { icon: <SlidersHorizontal color="#A5AEC0" size={19} />, label: isRefreshing ? 'Updating' : 'Refresh', onPress: refreshWallet },
          ...(needsTestGas ? [{ icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Faucet', onPress: openFaucet }] : []),
        ]}
      />

      <View style={styles.sectionBlock}>
        <SectionHeader actionHref="/tokens" actionLabel="Manage" title="Assets" />
        {assetRows.length > 0 ? (
          assetRows.map((asset) => (
            <AssetListRow asset={asset} href={{ pathname: '/tokens/[address]', params: { address: asset.address } }} key={asset.address} />
          ))
        ) : (
          <EmptyState label="No assets found" />
        )}
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader actionHref="/activity" actionLabel="All" title="Recent activity" />
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <ActivityListRow activity={activity} href={{ pathname: '/activity/[hash]', params: { hash: activity.hash } }} key={activity.hash} />
          ))
        ) : (
          <EmptyState label={activeWallet ? 'No activity yet' : 'Creating wallet'} />
        )}
      </View>
    </AppScreen>
  );
}

export function AssetsScreen() {
  const router = useRouter();
  const { addTokenByContract, assets, chainId, isRefreshing, lifeAsset, refreshError, refreshWallet, setChainId } = useWallet();
  const syncNotice = getSyncNotice(refreshError, 'assets');
  const [query, setQuery] = useState('');
  const [addTokenVisible, setAddTokenVisible] = useState(false);
  const [tokenContract, setTokenContract] = useState('');
  const [addTokenError, setAddTokenError] = useState<string | null>(null);
  const [tokenNetworkHint, setTokenNetworkHint] = useState<{
    chainId: SupportedChainId;
    name: string;
    symbol: string;
  } | null>(null);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const filteredAssets = assets.filter((asset) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return true;
    }
    return [asset.name, asset.symbol, asset.contractAddress ?? ''].some((value) => value.toLowerCase().includes(keyword));
  });
  const assetRows = filteredAssets.map(toMockAsset);
  const pinnedLife = lifeAsset ? toMockAsset(lifeAsset) : mockAssets[0];
  const openAddToken = () => {
    setAddTokenError(null);
    setTokenNetworkHint(null);
    setAddTokenVisible(true);
  };
  const pasteTokenContract = async () => {
    const clipboardText = await Clipboard.getStringAsync();
    setTokenContract(sanitizeAddressInput(clipboardText));
    setAddTokenError(null);
    setTokenNetworkHint(null);
  };
  const clearTokenContract = () => {
    setTokenContract('');
    setAddTokenError(null);
    setTokenNetworkHint(null);
  };
  const switchToTokenNetwork = () => {
    if (!tokenNetworkHint) {
      return;
    }

    setChainId(tokenNetworkHint.chainId);
    setAddTokenError(null);
    setTokenNetworkHint(null);
  };
  const submitAddToken = async () => {
    setIsAddingToken(true);
    setAddTokenError(null);
    setTokenNetworkHint(null);
    try {
      const result = await addTokenByContract(tokenContract);

      if (!result.asset) {
        setAddTokenError(result.error ?? 'Unable to add token.');
        setTokenNetworkHint(result.networkHint ?? null);
        return;
      }

      setTokenContract('');
      setAddTokenVisible(false);
      router.push({
        pathname: '/tokens/[address]',
        params: { address: result.asset.contractAddress ?? result.asset.id },
      });
    } finally {
      setIsAddingToken(false);
    }
  };

  return (
    <AppScreen bottomNav title="Assets">
      <AppInput icon={<Search color="#667085" size={18} />} onChangeText={setQuery} placeholder="Search assets" value={query} />
      <View style={styles.assetPin}>
        <View style={styles.assetPinTop}>
          <TokenMark asset={pinnedLife} size={48} />
          <View style={styles.assetPinCopy}>
            <AppText>LIFE</AppText>
            <AppText tone="muted" variant="caption">
              Core asset
            </AppText>
          </View>
          <View style={styles.assetPinValue}>
            <AppText>{pinnedLife.fiatValue}</AppText>
            <AppText tone="lime" variant="caption">
              {pinnedLife.change}
            </AppText>
          </View>
        </View>
      </View>
      {syncNotice ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">{syncNotice}</AppText>
        </View>
      ) : null}

      <ActionRail
        items={[
          { icon: <Plus color="#C7FF3D" size={19} />, label: 'Add token', onPress: openAddToken },
          { icon: <SlidersHorizontal color="#A5AEC0" size={19} />, label: isRefreshing ? 'Updating' : 'Refresh', onPress: refreshWallet },
        ]}
      />

      <View style={styles.sectionBlock}>
        <SectionHeader title={`${supportedChains[chainId].shortName} assets`} />
        {assetRows.length > 0 ? (
          assetRows.map((asset) => (
            <AssetListRow asset={asset} href={{ pathname: '/tokens/[address]', params: { address: asset.address } }} key={asset.address} />
          ))
        ) : (
          <EmptyState label="No matching assets" />
        )}
      </View>

      <BottomSheet title="Add token" visible={addTokenVisible} onClose={() => setAddTokenVisible(false)}>
        <View style={styles.formStack}>
          <AppText tone="muted" variant="caption">
            Contract
          </AppText>
          <AppInput
            onChangeText={(value) => {
              setTokenContract(sanitizeAddressInput(value));
              setAddTokenError(null);
              setTokenNetworkHint(null);
            }}
            placeholder="0x token contract"
            value={tokenContract}
          />
          <View style={styles.inlineActionRow}>
            <Pressable accessibilityRole="button" onPress={pasteTokenContract} style={styles.maxButton}>
              <AppText tone="lime" variant="caption">Paste</AppText>
            </Pressable>
            {tokenContract.trim() ? (
              <Pressable accessibilityRole="button" onPress={clearTokenContract} style={styles.maxButton}>
                <AppText tone="muted" variant="caption">Clear</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
        {addTokenError ? (
          <View style={styles.warningPanel}>
            <AlertTriangle color="#FF6B6B" size={18} />
            <AppText tone="danger">{addTokenError}</AppText>
          </View>
        ) : null}
        {tokenNetworkHint ? (
          <View style={styles.warningPanel}>
            <AlertTriangle color="#F3BA2F" size={18} />
            <View style={styles.warningCopy}>
              <AppText tone="muted">
                {tokenNetworkHint.symbol} is on {supportedChains[tokenNetworkHint.chainId].shortName}.
              </AppText>
              <Pressable accessibilityRole="button" onPress={switchToTokenNetwork}>
                <AppText tone="lime">Switch network</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
        <AppButton disabled={isAddingToken} style={isAddingToken && styles.disabledButton} onPress={submitAddToken}>
          {isAddingToken ? 'Adding' : 'Add token'}
        </AppButton>
      </BottomSheet>
    </AppScreen>
  );
}

export function AssetDetailScreen() {
  const params = useLocalSearchParams<{ address?: string }>();
  const router = useRouter();
  const { activeWallet, activities, assets, chainId, removeManualToken } = useWallet();
  const chain = supportedChains[chainId];
  const [copiedContract, setCopiedContract] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);
  const selectedAsset = assets.find((item) => (item.type === 'native' && params.address === 'native') || normalizeAssetAddress(item.contractAddress) === normalizeAssetAddress(params.address));

  if (!selectedAsset) {
    return (
      <AppScreen bottomNav backHref="/tokens" title="Asset">
        <EmptyState label="Asset not found" />
      </AppScreen>
    );
  }

  const asset = toMockAsset(selectedAsset);
  const tokenActivity = activities.filter((activity) => matchesActivityAsset(activity, selectedAsset)).map(toMockActivity);
  const canRemove = selectedAsset.discoveredBy === 'manual';
  const openAssetExplorer = () => {
    const target = selectedAsset?.contractAddress
      ? `${chain.explorerBaseUrl}/token/${selectedAsset.contractAddress}`
      : activeWallet
        ? `${chain.explorerBaseUrl}/address/${activeWallet.address}`
        : `${chain.explorerBaseUrl}`;
    Linking.openURL(target);
  };
  const copyContract = async () => {
    if (selectedAsset.contractAddress) {
      await Clipboard.setStringAsync(selectedAsset.contractAddress);
      setCopiedContract(true);
    }
  };
  const confirmRemove = () => {
    if (removeManualToken(selectedAsset.id)) {
      setRemoveVisible(false);
      router.replace('/tokens');
    }
  };

  return (
    <AppScreen bottomNav backHref="/tokens">
      <View style={styles.assetDetailHead}>
        <TokenMark asset={asset} size={54} />
        <View style={styles.assetDetailCopy}>
          <AppText variant="title">{asset.name}</AppText>
          <AppText tone="muted" variant="caption">
            {asset.kind} · {supportedChains[chainId].shortName}
          </AppText>
        </View>
      </View>

      <LargeBalanceHeader subtitle={`${asset.symbol} balance`} value={asset.fiatValue} left={<MiniBalance label={asset.symbol} value={asset.balance} />} />

      <ActionRail
        items={[
          {
            href: { pathname: '/send', params: { asset: selectedAsset?.id ?? asset.address } },
            icon: <ArrowUpRight color="#C7FF3D" size={19} />,
            label: 'Send',
          },
          { href: '/receive', icon: <ArrowDownLeft color="#C7FF3D" size={19} />, label: 'Receive' },
          { icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Explorer', onPress: openAssetExplorer },
          ...(selectedAsset.contractAddress ? [{ icon: <Copy color="#A5AEC0" size={19} />, label: copiedContract ? 'Copied' : 'Contract', onPress: copyContract }] : []),
          ...(canRemove ? [{ icon: <Trash2 color="#FF6B6B" size={19} />, label: 'Remove', onPress: () => setRemoveVisible(true) }] : []),
        ]}
      />

      <View style={styles.infoCard}>
        <InfoLine label="Price" value={asset.price} />
        <InfoLine label="24h" tone={asset.change.startsWith('-') ? 'danger' : 'lime'} value={asset.change} />
        <InfoLine label="Network" value={chain.shortName} />
        <InfoLine label="Contract" value={selectedAsset?.contractAddress ? shortAddress(selectedAsset.contractAddress, 8, 6) : 'Native'} />
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader title="Activity" />
        {tokenActivity.length > 0 ? (
          tokenActivity.slice(0, 4).map((activity) => (
            <ActivityListRow activity={activity} href={{ pathname: '/activity/[hash]', params: { hash: activity.hash } }} key={`${asset.address}-${activity.hash}`} />
          ))
        ) : (
          <EmptyState label="No token activity" />
        )}
      </View>

      <BottomSheet title="Remove token" visible={removeVisible} onClose={() => setRemoveVisible(false)}>
        <View style={styles.infoCardCompact}>
          <InfoLine label="Token" value={asset.symbol} />
          <InfoLine label="Network" value={chain.shortName} />
        </View>
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">This only hides the token from LIFE Wallet.</AppText>
        </View>
        <AppButton tone="danger" onPress={confirmRemove}>
          Remove token
        </AppButton>
      </BottomSheet>
    </AppScreen>
  );
}

export function SendScreen() {
  const params = useLocalSearchParams<{ amount?: string; asset?: string; recipient?: string; source?: string }>();
  const router = useRouter();
  const { activeWallet, activities, assets, chainId, estimateSendFee, inspectRecipient, nativeAsset, refreshWallet, sendTransfer, validateSend } = useWallet();
  const chain = supportedChains[chainId];
  const draftSource = getRouteParam(params.source);
  const isRetryDraft = draftSource === 'retry';
  const isRepeatDraft = draftSource === 'repeat';
  const hasPrefilledDraft = isRetryDraft || isRepeatDraft;
  const [reviewVisible, setReviewVisible] = useState(false);
  const [sentVisible, setSentVisible] = useState(false);
  const [amount, setAmount] = useState(() => sanitizeAmountInput(getRouteParam(params.amount)));
  const [recipient, setRecipient] = useState(() => sanitizeAddressInput(getRouteParam(params.recipient)));
  const [recipientKind, setRecipientKind] = useState<'account' | 'contract' | 'unknown'>('unknown');
  const [recipientWarning, setRecipientWarning] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [submittedActivity, setSubmittedActivity] = useState<WalletActivity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [isInspectingRecipient, setIsInspectingRecipient] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ??
    assets.find((asset) => matchesAssetParam(asset, params.asset)) ??
    nativeAsset ??
    assets[0];
  const selectedAssetIdForSend = selectedAsset?.id ?? '';
  const sendableAssets = assets.filter((asset) => asset.type === 'native' || asset.balance > 0 || asset.symbol === 'LIFE');
  const selected = selectedAsset ? toMockAsset(selectedAsset) : mockAssets[1];
  const displayAmount = amount.trim() || '0';
  const amountNumber = Number(displayAmount.replace(/,/g, ''));
  const fiatAmount = Number.isFinite(amountNumber) && selectedAsset ? formatCurrency(amountNumber * selectedAsset.priceUsd) : '$0.00';
  const measuredGasReserve = estimatedFee !== null ? getGasReserveBnb(estimatedFee) : null;
  const validation = selectedAsset
    ? validateSend(selectedAsset.id, recipient, amount, measuredGasReserve)
    : { errors: ['Wallet is not ready.'], estimatedGasBnb: 0, isValid: false };
  const gasEstimate = validation.estimatedGasBnb;
  const remainingAfterSend =
    selectedAsset && Number.isFinite(amountNumber)
      ? Math.max(selectedAsset.balance - amountNumber - (selectedAsset.type === 'native' ? gasEstimate : 0), 0)
      : null;
  const canReview = Boolean(activeWallet && selectedAsset && validation.isValid && !isSubmitting);
  const hasStartedSend = Boolean(recipient.trim() || amount.trim());
  const recipientStatusLabel = isInspectingRecipient ? 'Checking' : getRecipientStatusLabel(recipientKind, recipient);
  const recipientSafetyWarning = recipientWarning && !validation.errors.includes(recipientWarning) ? recipientWarning : null;
  const nativeBalance = nativeAsset?.balance ?? 0;
  const maxAmount = selectedAsset
    ? selectedAsset.type === 'native'
      ? Math.max(selectedAsset.balance - gasEstimate, 0)
      : selectedAsset.balance
    : 0;
  const isTokenTransfer = selectedAsset?.type === 'bep20';
  const gasAfterSend = Math.max(nativeBalance - gasEstimate, 0);
  const hasLowGasAfterSend = Boolean(isTokenTransfer && nativeBalance > gasEstimate && gasAfterSend < gasEstimate);
  const tokenContractAddress = isTokenTransfer ? selectedAsset.contractAddress : undefined;
  const reviewOperation = isTokenTransfer ? 'BEP-20 transfer' : 'Native transfer';
  const reviewTarget = tokenContractAddress ?? recipient;
  const recentRecipients = useMemo(
    () => getRecentRecipients(activities, chainId, activeWallet?.address),
    [activities, activeWallet?.address, chainId],
  );
  useEffect(() => {
    if (!selectedAsset || !recipient.trim() || !amount.trim()) {
      const resetTimer = setTimeout(() => {
        setEstimatedFee(null);
        setFeeError(null);
        setIsEstimatingFee(false);
      }, 0);

      return () => {
        clearTimeout(resetTimer);
      };
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setIsEstimatingFee(true);
      estimateSendFee(selectedAsset.id, recipient, amount)
        .then((result) => {
          if (!cancelled) {
            setEstimatedFee(result.fee);
            setFeeError(result.error);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsEstimatingFee(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amount, estimateSendFee, recipient, selectedAsset]);
  useEffect(() => {
    const trimmedRecipient = recipient.trim();

    if (!selectedAssetIdForSend || !isAddress(trimmedRecipient)) {
      const resetTimer = setTimeout(() => {
        setRecipientKind('unknown');
        setRecipientWarning(null);
        setIsInspectingRecipient(false);
      }, 0);

      return () => {
        clearTimeout(resetTimer);
      };
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setIsInspectingRecipient(true);
      inspectRecipient(trimmedRecipient, selectedAssetIdForSend)
        .then((result) => {
          if (!cancelled) {
            setRecipientKind(result.kind);
            setRecipientWarning(result.warning);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsInspectingRecipient(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inspectRecipient, recipient, selectedAssetIdForSend]);
  const onAmountChange = (value: string) => {
    setAmount(sanitizeAmountInput(value));
  };
  const pasteRecipient = async () => {
    const clipboardText = await Clipboard.getStringAsync();
    setRecipient(sanitizeAddressInput(clipboardText));
  };
  const clearRecipient = () => {
    setRecipient('');
  };
  const selectRecentRecipient = (address: string) => {
    setRecipient(address);
    setRecipientWarning(null);
    setSendError(null);
  };
  const fillMaxAmount = () => {
    setAmount(maxAmount > 0 ? String(Number(maxAmount.toFixed(selectedAsset?.type === 'native' ? 6 : 8))) : '');
  };
  const openFaucet = () => {
    if (chain.faucetUrl) {
      Linking.openURL(chain.faucetUrl);
    }
  };
  const copyRecipientAddress = async () => {
    if (isAddress(recipient.trim())) {
      await Clipboard.setStringAsync(recipient.trim());
    }
  };
  const copyTokenContract = async () => {
    if (tokenContractAddress) {
      await Clipboard.setStringAsync(tokenContractAddress);
    }
  };
  const openRecipientExplorer = () => {
    if (isAddress(recipient.trim())) {
      Linking.openURL(`${chain.explorerBaseUrl}/address/${recipient.trim()}`);
    }
  };
  const openTokenContractExplorer = () => {
    if (tokenContractAddress) {
      Linking.openURL(`${chain.explorerBaseUrl}/address/${tokenContractAddress}`);
    }
  };
  const openReview = () => {
    setSendError(null);
    if (canReview) {
      setReviewVisible(true);
    }
  };
  const confirmSend = async () => {
    if (!selectedAsset || !canReview) {
      return;
    }

    setIsSubmitting(true);
    setSendError(null);
    try {
      const activity = await sendTransfer({
        amount,
        assetId: selectedAsset.id,
        recipient,
      });

      if (!activity) {
        setSendError('Transfer failed.');
        return;
      }

      setSubmittedActivity(activity);
      setReviewVisible(false);
      setSentVisible(true);
      refreshWallet().catch(() => undefined);
    } catch (error) {
      setSendError(getSendErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      backHref="/"
      title="Send"
      fixedBottom={
        <AppButton disabled={!canReview} style={[styles.fullFlex, !canReview && styles.disabledButton]} onPress={openReview}>
          Review
        </AppButton>
      }>
      <View style={styles.formStack}>
        <AppText tone="muted" variant="caption">
          Asset
        </AppText>
        <View style={styles.assetOptionList}>
          {sendableAssets.map((asset) => {
            const option = toMockAsset(asset);
            const active = selectedAsset?.id === asset.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={asset.id}
                onPress={() => setSelectedAssetId(asset.id)}
                style={[styles.assetOption, active && styles.assetOptionActive]}>
                <TokenMark asset={option} size={34} />
                <View style={styles.assetOptionCopy}>
                  <AppText>{option.symbol}</AppText>
                  <AppText tone="muted" variant="caption">
                    {option.balance} available
                  </AppText>
                </View>
                {active ? <Check color="#C7FF3D" size={17} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.formStack}>
        <AppText tone="muted" variant="caption">
          Recipient
        </AppText>
        <AppInput onChangeText={(value) => setRecipient(sanitizeAddressInput(value))} placeholder="0x address" value={recipient} />
        <View style={styles.inlineActionRow}>
          <Pressable accessibilityRole="button" onPress={pasteRecipient} style={styles.maxButton}>
            <AppText tone="lime" variant="caption">Paste</AppText>
          </Pressable>
          {recipient.trim() ? (
            <Pressable accessibilityRole="button" onPress={clearRecipient} style={styles.maxButton}>
              <AppText tone="muted" variant="caption">Clear</AppText>
            </Pressable>
          ) : null}
        </View>
        {!recipient.trim() && recentRecipients.length > 0 ? (
          <View style={styles.recipientSuggestionList}>
            {recentRecipients.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.address}
                onPress={() => selectRecentRecipient(item.address)}
                style={styles.recipientSuggestion}>
                <View style={styles.recipientSuggestionIcon}>
                  <Wallet color="#C7FF3D" size={16} />
                </View>
                <View style={styles.recipientSuggestionCopy}>
                  <AppText>{item.label}</AppText>
                  <AppText tone="muted" variant="caption">
                    {item.meta}
                  </AppText>
                </View>
                <ChevronRight color="#667085" size={16} />
              </Pressable>
            ))}
          </View>
        ) : null}
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
        <AppText tone="muted">{selected.symbol} · {fiatAmount}</AppText>
        <Pressable accessibilityRole="button" onPress={fillMaxAmount} style={styles.maxButton}>
          <AppText tone="lime" variant="caption">Max</AppText>
        </Pressable>
      </View>

      {hasPrefilledDraft ? (
        <View style={styles.infoCardCompact}>
          <InfoLine label="Draft" tone={isRetryDraft ? 'amber' : 'lime'} value={isRetryDraft ? 'Retry failed send' : 'Send again'} />
          <InfoLine label="Editable" value="Review before sending" />
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <InfoLine label="Gas reserve" value={isEstimatingFee ? 'Estimating' : `${formatTokenAmount(gasEstimate, 8)} ${nativeAsset?.symbol ?? 'tBNB'}`} />
        <InfoLine label="Network" value={chain.shortName} />
        <InfoLine label="Recipient" value={recipientStatusLabel} />
        <InfoLine label="From" value={activeWallet ? shortAddress(activeWallet.address, 8, 6) : 'Creating wallet'} />
      </View>

      {recipientSafetyWarning && hasStartedSend ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">{recipientSafetyWarning}</AppText>
        </View>
      ) : null}

      {feeError && hasStartedSend ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">{feeError}</AppText>
        </View>
      ) : null}

      {nativeBalance <= 0 && chain.faucetUrl ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <View style={styles.warningCopy}>
            <AppText tone="muted">You need {chain.nativeCurrency.symbol} for gas.</AppText>
            <Pressable accessibilityRole="link" onPress={openFaucet}>
              <AppText tone="lime">Open faucet</AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {hasLowGasAfterSend ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">Gas balance will be low after this transfer.</AppText>
        </View>
      ) : null}

      {validation.errors.length > 0 && hasStartedSend ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <View style={styles.warningCopy}>
            {validation.errors.slice(0, 3).map((error) => (
              <AppText key={error} tone="muted">
                {error}
              </AppText>
            ))}
          </View>
        </View>
      ) : null}

      {sendError ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#FF6B6B" size={18} />
          <AppText tone="danger">{sendError}</AppText>
        </View>
      ) : null}

      <BottomSheet title="Review send" visible={reviewVisible} onClose={() => setReviewVisible(false)}>
        <View style={styles.reviewHero}>
          <ArrowUpRight color="#C7FF3D" size={22} />
          <View style={styles.reviewHeroCopy}>
            <AppText>{displayAmount} {selected.symbol}</AppText>
            <AppText tone="muted" variant="caption">
              To {shortAddress(recipient, 8, 6)}
            </AppText>
          </View>
        </View>
        <View style={styles.infoCardCompact}>
          <InfoLine label="Action" value={reviewOperation} />
          <InfoLine label="You send" value={`${displayAmount} ${selected.symbol}`} />
          <InfoLine label="Recipient" value={shortAddress(recipient, 8, 6)} />
          <InfoLine label="Recipient type" tone={recipientKind === 'contract' ? 'amber' : 'primary'} value={recipientStatusLabel} />
          <InfoLine label="Call target" value={shortAddress(reviewTarget, 8, 6)} />
          {tokenContractAddress ? <InfoLine label="Function" value="transfer(address,uint256)" /> : null}
          {tokenContractAddress ? <InfoLine label="Token contract" value={shortAddress(tokenContractAddress, 8, 6)} /> : null}
          <InfoLine label="From" value={activeWallet ? shortAddress(activeWallet.address, 8, 6) : 'Creating wallet'} />
          <InfoLine label="Gas reserve" value={`${formatTokenAmount(gasEstimate, 8)} ${nativeAsset?.symbol ?? 'tBNB'}`} />
          <InfoLine label="Gas balance" value={`${formatTokenAmount(nativeBalance, 6)} ${nativeAsset?.symbol ?? chain.nativeCurrency.symbol}`} />
          {isTokenTransfer ? <InfoLine label="Gas after" tone={hasLowGasAfterSend ? 'amber' : 'primary'} value={`${formatTokenAmount(gasAfterSend, 6)} ${nativeAsset?.symbol ?? chain.nativeCurrency.symbol}`} /> : null}
          {remainingAfterSend !== null ? <InfoLine label="After" value={`${formatTokenAmount(remainingAfterSend, selectedAsset?.type === 'native' ? 6 : 4)} ${selected.symbol}`} /> : null}
          <InfoLine label="Network" value={chain.shortName} />
        </View>
        {recipientKind === 'contract' ? (
          <View style={styles.warningPanel}>
            <AlertTriangle color="#F3BA2F" size={18} />
            <AppText tone="muted">Recipient is a contract address. Confirm this is intended.</AppText>
          </View>
        ) : null}
        <ActionRail
          items={[
            { icon: <Copy color="#C7FF3D" size={19} />, label: 'Copy to', onPress: copyRecipientAddress },
            { icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Recipient', onPress: openRecipientExplorer },
            ...(tokenContractAddress
              ? [
                  { icon: <Copy color="#A5AEC0" size={19} />, label: 'Copy token', onPress: copyTokenContract },
                  { icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Contract', onPress: openTokenContractExplorer },
                ]
              : []),
          ]}
        />
        <AppButton disabled={isSubmitting} style={isSubmitting && styles.disabledButton} onPress={confirmSend}>
          {isSubmitting ? 'Sending' : 'Confirm Send'}
        </AppButton>
      </BottomSheet>

      <BottomSheet title="Transfer submitted" visible={sentVisible} onClose={() => setSentVisible(false)}>
        <CompletionNotice label={`${displayAmount} ${selected.symbol}`} subtitle={submittedActivity ? shortAddress(submittedActivity.hash, 10, 8) : 'Submitted'} />
        {submittedActivity ? (
          <ActionRail
            items={[
              { icon: <Copy color="#C7FF3D" size={19} />, label: 'Copy hash', onPress: () => Clipboard.setStringAsync(submittedActivity.hash) },
              { icon: <ChevronRight color="#A5AEC0" size={19} />, label: 'Activity', onPress: () => router.push({ pathname: '/activity/[hash]', params: { hash: submittedActivity.hash } }) },
              { icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Explorer', onPress: () => Linking.openURL(submittedActivity.explorerUrl) },
            ]}
          />
        ) : null}
        <AppButton onPress={() => setSentVisible(false)}>Done</AppButton>
      </BottomSheet>
    </AppScreen>
  );
}

export function ReceiveScreen() {
  const { activeWallet, chainId, isRefreshing, nativeAsset, refreshWallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [faucetOpened, setFaucetOpened] = useState(false);
  const address = activeWallet?.address ?? '';
  const chain = supportedChains[chainId];
  const gasBalance = nativeAsset?.balance ?? 0;
  const hasFaucet = Boolean(chain.faucetUrl);
  const needsGas = hasFaucet && gasBalance <= 0;
  const copyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      setCopied(true);
    }
  };
  const shareAddress = async () => {
    if (address) {
      await Share.share({ message: address });
    }
  };
  const openFaucet = () => {
    if (chain.faucetUrl) {
      setFaucetOpened(true);
      Linking.openURL(chain.faucetUrl);
    }
  };
  const refreshBalance = () => {
    refreshWallet().catch(() => undefined);
  };

  return (
    <AppScreen title="Receive" backHref="/">
      <View style={styles.receiveCard}>
        <View style={styles.qrWrap}>
          {address ? (
            <QRCode backgroundColor="transparent" color="#F7FAFF" size={190} value={address} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Wallet color="#A5AEC0" size={34} />
              <AppText tone="muted">Creating wallet</AppText>
            </View>
          )}
        </View>
        <AppText variant="caption" tone="amber">
          {chain.shortName} only
        </AppText>
        <AppText variant="mono" style={styles.addressText}>
          {address || 'Wallet address is being created'}
        </AppText>
      </View>

      <ActionRail
        items={[
          { icon: <Copy color="#C7FF3D" size={19} />, label: copied ? 'Copied' : 'Copy', onPress: copyAddress },
          { icon: <QrCode color="#A5AEC0" size={19} />, label: 'Share', onPress: shareAddress },
          ...(hasFaucet ? [{ icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Faucet', onPress: openFaucet }] : []),
          { icon: <SlidersHorizontal color="#A5AEC0" size={19} />, label: isRefreshing ? 'Updating' : 'Refresh', onPress: refreshBalance },
        ]}
      />

      <View style={styles.infoCardCompact}>
        <InfoLine label="Network" value={chain.shortName} />
        <InfoLine label="Gas" tone={needsGas ? 'amber' : 'lime'} value={`${formatTokenAmount(gasBalance, 6)} ${chain.nativeCurrency.symbol}`} />
        {hasFaucet ? <InfoLine label="Funding" tone={needsGas ? 'amber' : 'lime'} value={needsGas ? (faucetOpened ? 'Waiting for faucet' : 'Use faucet') : 'Ready'} /> : null}
      </View>

      <View style={styles.warningPanel}>
        <AlertTriangle color="#F3BA2F" size={18} />
        <AppText tone="muted">Only send {chain.nativeCurrency.symbol} or {chain.shortName} assets to this address.</AppText>
      </View>

      {needsGas ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <View style={styles.warningCopy}>
            <AppText tone="muted">Request test gas, then refresh this wallet.</AppText>
            <Pressable accessibilityRole="button" onPress={faucetOpened ? refreshBalance : openFaucet}>
              <AppText tone="lime">{faucetOpened ? 'Refresh balance' : 'Open faucet'}</AppText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

export function ActivityScreen() {
  const router = useRouter();
  const { activeWallet, activities, chainId, isRefreshing, refreshActivityStatus, refreshError, refreshWallet } = useWallet();
  const chain = supportedChains[chainId];
  const syncNotice = getSyncNotice(refreshError, 'activity');
  const pendingNotice = activities.find((activity) => activity.status === 'pending' && activity.pendingNotice)?.pendingNotice;
  const [activityQuery, setActivityQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilterValue>('all');
  const [lookupHash, setLookupHash] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const filteredActivities = useMemo(
    () => activities.filter((activity) => matchesActivityFilter(activity, activityQuery, activityFilter)),
    [activities, activityFilter, activityQuery],
  );
  const groups = useMemo(() => groupActivities(filteredActivities.map(toMockActivity)), [filteredActivities]);
  const openExplorer = () => {
    if (activeWallet) {
      Linking.openURL(`${chain.explorerBaseUrl}/address/${activeWallet.address}`);
    }
  };
  const refreshActivity = () => {
    refreshWallet().catch(() => undefined);
    refreshActivityStatus().catch(() => undefined);
  };
  const pasteLookupHash = async () => {
    const clipboardText = await Clipboard.getStringAsync();
    setLookupHash(sanitizeHashInput(clipboardText));
    setLookupError(null);
  };
  const clearLookupHash = () => {
    setLookupHash('');
    setLookupError(null);
  };
  const openLookup = () => {
    const nextHash = lookupHash.trim();

    if (!isTransactionHash(nextHash)) {
      setLookupError('Enter a valid transaction hash.');
      return;
    }

    setLookupError(null);
    router.push({ pathname: '/activity/[hash]', params: { hash: nextHash } });
  };

  return (
    <AppScreen bottomNav title="Activity">
      <View style={styles.filterRow}>
        <StatusBadge status={chain.shortName} />
        {isRefreshing ? <StatusBadge status="Updating" /> : null}
      </View>
      <AppInput icon={<Search color="#667085" size={18} />} onChangeText={setActivityQuery} placeholder="Search activity" value={activityQuery} />
      <View style={styles.activityFilterRow}>
        {activityFilters.map((filter) => {
          const active = activityFilter === filter.value;
          return (
            <Pressable
              accessibilityRole="button"
              key={filter.value}
              onPress={() => setActivityFilter(filter.value)}
              style={[styles.activityFilterButton, active && styles.activityFilterButtonActive]}>
              <AppText tone={active ? 'lime' : 'muted'} variant="caption">
                {filter.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.lookupPanel}>
        <View style={styles.lookupInputRow}>
          <AppInput
            onChangeText={(value) => {
              setLookupHash(sanitizeHashInput(value));
              setLookupError(null);
            }}
            placeholder="Transaction hash"
            value={lookupHash}
            style={styles.lookupInput}
          />
          <Pressable accessibilityRole="button" onPress={openLookup} style={styles.lookupButton}>
            <Search color="#C7FF3D" size={18} />
          </Pressable>
        </View>
        <View style={styles.inlineActionRow}>
          <Pressable accessibilityRole="button" onPress={pasteLookupHash} style={styles.maxButton}>
            <AppText tone="lime" variant="caption">Paste</AppText>
          </Pressable>
          {lookupHash ? (
            <Pressable accessibilityRole="button" onPress={clearLookupHash} style={styles.maxButton}>
              <AppText tone="muted" variant="caption">Clear</AppText>
            </Pressable>
          ) : null}
        </View>
        {lookupError ? (
          <AppText tone="danger" variant="caption">
            {lookupError}
          </AppText>
        ) : null}
      </View>
      <ActionRail
        items={[
          { icon: <SlidersHorizontal color="#C7FF3D" size={19} />, label: isRefreshing ? 'Updating' : 'Refresh', onPress: refreshActivity },
          ...(activeWallet ? [{ icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Explorer', onPress: openExplorer }] : []),
        ]}
      />
      {syncNotice ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">{syncNotice}</AppText>
        </View>
      ) : null}
      {pendingNotice ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">{pendingNotice}</AppText>
        </View>
      ) : null}
      {groups.length > 0 ? (
        groups.map((group) => (
          <View style={styles.sectionBlock} key={group.date}>
            <SectionHeader title={group.date} />
            {group.items.map((activity) => (
              <ActivityListRow activity={activity} href={{ pathname: '/activity/[hash]', params: { hash: activity.hash } }} key={activity.hash} />
            ))}
          </View>
        ))
      ) : (
        <EmptyState label={activities.length > 0 ? 'No matching activity' : 'No activity yet'} />
      )}
    </AppScreen>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuthSession();
  const { activeWallet, chainId, setChainId, wallets } = useWallet();
  const chain = supportedChains[chainId];
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [networkSheetVisible, setNetworkSheetVisible] = useState(false);
  const signOutWallet = async () => {
    await signOut();
    router.replace('/sign-in');
  };
  const openAddressExplorer = () => {
    if (activeWallet) {
      Linking.openURL(`${chain.explorerBaseUrl}/address/${activeWallet.address}`);
    }
  };
  const copyAddress = async () => {
    if (activeWallet) {
      await Clipboard.setStringAsync(activeWallet.address);
      setCopiedAddress(true);
    }
  };
  const selectNetwork = (nextChainId: SupportedChainId) => {
    setChainId(nextChainId);
    setNetworkSheetVisible(false);
  };

  return (
    <AppScreen bottomNav title="Profile">
      <View style={styles.profileCard}>
        <View style={styles.profileMark}>
          <Wallet color="#C7FF3D" size={22} />
        </View>
        <View style={styles.profileCopy}>
          <AppText>Main Wallet</AppText>
          <AppText tone="muted" variant="caption">
            {activeWallet ? shortAddress(activeWallet.address) : 'Creating wallet'}
          </AppText>
        </View>
      </View>

      <View style={styles.infoCardCompact}>
        <InfoLine label="Network" tone="amber" value={chain.shortName} />
        <InfoLine label="Address" value={activeWallet ? shortAddress(activeWallet.address, 8, 6) : 'Pending'} />
      </View>

      <SettingsSection title="Wallets">
        <SettingsRow icon={<Wallet color="#C7FF3D" size={18} />} meta={<StatusBadge status={String(wallets.length)} />} title="Wallets" onPress={() => router.push('/wallets')} />
      </SettingsSection>

      <SettingsSection title="Network">
        <SettingsRow icon={<SlidersHorizontal color="#C7FF3D" size={18} />} meta={<StatusBadge status={chain.shortName} />} title="Network" onPress={() => setNetworkSheetVisible(true)} />
        {activeWallet ? <SettingsRow icon={<Copy color="#A5AEC0" size={18} />} title={copiedAddress ? 'Address copied' : 'Copy address'} onPress={copyAddress} /> : null}
        {activeWallet ? <SettingsRow icon={<ExternalLink color="#A5AEC0" size={18} />} title="Explorer" onPress={openAddressExplorer} /> : null}
      </SettingsSection>

      <SettingsSection title="Security">
        <SettingsRow icon={<ShieldCheck color="#C7FF3D" size={18} />} title="Security center" onPress={() => router.push('/security')} />
      </SettingsSection>

      <SettingsSection title="Account">
        <SettingsRow icon={<LogOut color="#FF6B6B" size={18} />} title="Sign out" onPress={signOutWallet} />
      </SettingsSection>

      <BottomSheet title="Network" visible={networkSheetVisible} onClose={() => setNetworkSheetVisible(false)}>
        <View style={styles.networkOptionList}>
          {selectableChains.map((option) => {
            const active = option.id === chainId;
            return (
              <Pressable
                accessibilityRole="button"
                key={option.id}
                onPress={() => selectNetwork(option.id)}
                style={[styles.networkOption, active && styles.networkOptionActive]}>
                <View style={[styles.networkOptionDot, active && styles.networkOptionDotActive]} />
                <View style={styles.networkOptionCopy}>
                  <AppText>{option.shortName}</AppText>
                  <AppText tone="muted" variant="caption">
                    {option.nativeCurrency.symbol} · Chain ID {option.id}
                  </AppText>
                </View>
                {active ? <Check color="#C7FF3D" size={18} /> : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.infoCardCompact}>
          <InfoLine label="Explorer" value={chain.explorerBaseUrl.replace('https://', '')} />
          <InfoLine label="RPC" value="Configured" />
        </View>
      </BottomSheet>
    </AppScreen>
  );
}

export function SecurityScreen() {
  return (
    <AppScreen title="Security" backHref="/profile">
      <View style={styles.securityStatus}>
        <ShieldCheck color="#C7FF3D" size={24} />
        <View style={styles.securityCopy}>
          <AppText>Secure</AppText>
          <AppText tone="muted" variant="caption">
            Google connected
          </AppText>
        </View>
      </View>

      <SettingsSection title="Wallet">
        <SettingsRow icon={<Cloud color="#A5AEC0" size={18} />} title="Backup" meta={<StatusBadge status="Later" />} />
        <SettingsRow icon={<Download color="#A5AEC0" size={18} />} title="Export" meta={<StatusBadge status="Later" />} />
        <SettingsRow icon={<KeyRound color="#A5AEC0" size={18} />} title="Recovery" meta={<StatusBadge status="Later" />} />
      </SettingsSection>

      <SettingsSection title="Network">
        <SettingsRow icon={<ShieldCheck color="#A5AEC0" size={18} />} title="Approvals" meta={<StatusBadge status="0" />} />
        <SettingsRow icon={<Ban color="#A5AEC0" size={18} />} title="dApps" meta={<StatusBadge status="0" />} />
      </SettingsSection>
    </AppScreen>
  );
}

export function WalletsScreen() {
  const { activeWallet, wallets } = useWallet();
  const walletRows = wallets.map(toMockWallet);

  return (
    <AppScreen title="Wallets" backHref="/profile">
      <View style={styles.sectionBlock}>
        {walletRows.length > 0 ? (
          walletRows.map((wallet) => <WalletRow wallet={wallet} active={wallet.address === activeWallet?.address} key={wallet.address} />)
        ) : (
          <View style={styles.infoCardCompact}>
            <InfoLine label="Main Wallet" tone="amber" value="Creating wallet" />
          </View>
        )}
      </View>
    </AppScreen>
  );
}

export function BackupScreen() {
  return (
    <AppScreen title="Backup" backHref="/security">
      <View style={styles.securityStatus}>
        <Cloud color="#A5AEC0" size={24} />
        <View style={styles.securityCopy}>
          <AppText>Not available</AppText>
          <AppText tone="muted" variant="caption">
            Policy pending
          </AppText>
        </View>
        <StatusBadge status="Later" />
      </View>

      <View style={styles.infoCard}>
        <InfoLine label="Google" tone="lime" value="Connected" />
        <InfoLine label="Backup" value="Disabled" />
        <InfoLine label="Export" value="Disabled" />
      </View>
    </AppScreen>
  );
}

export function ExportScreen() {
  return (
    <AppScreen title="Export" backHref="/security">
      <View style={styles.keyPanel}>
        <View style={styles.keyPanelTop}>
          <Download color="#A5AEC0" size={20} />
          <AppText>Not available</AppText>
        </View>
        <AppText tone="muted">
          Key export is disabled for this MVP.
        </AppText>
      </View>
    </AppScreen>
  );
}

export function RecoveryScreen() {
  return (
    <AppScreen title="Recovery" backHref="/security">
      <View style={styles.infoCard}>
        <InfoLine label="Account" tone="lime" value="Google" />
        <InfoLine label="Backup" value="Disabled" />
        <InfoLine label="Access" tone="lime" value="Google" />
        <InfoLine label="Wallet" value="Embedded" />
      </View>
    </AppScreen>
  );
}

export function ActivityDetailScreen() {
  const params = useLocalSearchParams<{ hash?: string }>();
  const { activities, assets, chainId, lookupActivityAcrossChains, refreshActivityStatus, setChainId } = useWallet();
  const hash = sanitizeHashInput(getRouteParam(params.hash));
  const sourceActivity = activities.find((item) => item.hash === hash) ?? null;
  const [lookedUpActivity, setLookedUpActivity] = useState<WalletActivity | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const chain = supportedChains[chainId];
  const resolvedActivity = sourceActivity ?? lookedUpActivity;
  const displayChain = resolvedActivity ? supportedChains[resolvedActivity.chainId] : chain;
  const foundOnDifferentChain = Boolean(resolvedActivity && resolvedActivity.chainId !== chainId);
  const activity = resolvedActivity ? toMockActivity(resolvedActivity) : null;
  const explorerUrl = resolvedActivity?.explorerUrl ?? (hash ? `${chain.explorerBaseUrl}/tx/${hash}` : chain.explorerBaseUrl);
  const retryAsset = resolvedActivity ? findAssetForActivity(assets, resolvedActivity, displayChain.nativeCurrency.symbol) : undefined;
  const retryAssetId = retryAsset?.id;
  const canDraftOutgoingAgain = Boolean(
    resolvedActivity?.direction === 'out' &&
      resolvedActivity.status !== 'pending' &&
      resolvedActivity.to &&
      retryAssetId &&
      resolvedActivity.chainId === chainId,
  );
  const outgoingDraftLabel = resolvedActivity?.status === 'failed' ? 'Retry' : 'Send again';
  const outgoingDraftSource = resolvedActivity?.status === 'failed' ? 'retry' : 'repeat';

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) {
        return;
      }

      setLookedUpActivity(null);
      setLookupError(null);

      if (!hash || sourceActivity || !isTransactionHash(hash)) {
        setIsLookingUp(false);
        return;
      }

      setIsLookingUp(true);
      lookupActivityAcrossChains(hash)
        .then((lookupResult) => {
          if (!cancelled) {
            setLookedUpActivity(lookupResult?.activity ?? null);
            setLookupError(lookupResult ? null : 'Transaction not found on BSC or BSC Testnet.');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLookupError('Unable to look up this transaction.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLookingUp(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hash, lookupActivityAcrossChains, sourceActivity]);

  const copyHash = async () => {
    if (hash || activity?.hash) {
      await Clipboard.setStringAsync(activity?.hash ?? hash);
    }
  };
  const copyCounterparty = async () => {
    if (resolvedActivity?.counterparty) {
      await Clipboard.setStringAsync(resolvedActivity.counterparty);
    }
  };
  const openExplorer = () => {
    Linking.openURL(explorerUrl);
  };
  const switchToActivityNetwork = () => {
    if (resolvedActivity && resolvedActivity.chainId !== chainId) {
      setChainId(resolvedActivity.chainId);
    }
  };
  const refreshStatus = () => {
    if (sourceActivity?.hash) {
      refreshActivityStatus(sourceActivity.hash).catch(() => undefined);
      return;
    }

    if (hash && isTransactionHash(hash)) {
      setIsLookingUp(true);
      lookupActivityAcrossChains(hash)
        .then((lookupResult) => {
          setLookedUpActivity(lookupResult?.activity ?? null);
          setLookupError(lookupResult ? null : 'Transaction not found on BSC or BSC Testnet.');
        })
        .catch(() => setLookupError('Unable to look up this transaction.'))
        .finally(() => setIsLookingUp(false));
    }
  };

  if (!activity) {
    const emptyLabel = !isTransactionHash(hash)
      ? 'Invalid transaction hash'
      : isLookingUp
        ? 'Searching transaction'
        : lookupError ?? 'Transaction not found';

    return (
      <AppScreen title="Transaction" backHref="/activity">
        <EmptyState label={emptyLabel} />
        <ActionRail
          items={[
            { icon: <Copy color="#C7FF3D" size={19} />, label: 'Copy hash', onPress: copyHash },
            ...(isTransactionHash(hash) ? [{ icon: <SlidersHorizontal color="#A5AEC0" size={19} />, label: 'Retry', onPress: refreshStatus }] : []),
            { icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Explorer', onPress: openExplorer },
          ]}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Transaction" backHref="/activity">
      <View style={styles.reviewHero}>
        <View style={[styles.activityDetailIcon, activity.direction === 'in' ? styles.activityDetailIn : styles.activityDetailOut]}>
          {activity.direction === 'in' ? <ArrowDownLeft color="#C7FF3D" size={22} /> : <ArrowUpRight color="#F3BA2F" size={22} />}
        </View>
        <View style={styles.reviewHeroCopy}>
          <AppText>{activity.amount}</AppText>
          <AppText tone="muted" variant="caption">
            {activity.title}
          </AppText>
        </View>
        <StatusBadge status={activity.status} />
      </View>

      <View style={styles.infoCard}>
        <InfoLine label="Asset" value={activity.asset} />
        <InfoLine label="Status" tone={activity.status === 'Failed' ? 'danger' : activity.status === 'Pending' ? 'amber' : 'lime'} value={activity.status} />
        <InfoLine label="Network" tone={foundOnDifferentChain ? 'amber' : 'primary'} value={displayChain.shortName} />
        {resolvedActivity?.pendingNotice ? <InfoLine label="Pending" tone="amber" value={resolvedActivity.pendingNotice} /> : null}
        {resolvedActivity?.lastCheckedAt ? <InfoLine label="Last checked" value={formatCheckedAt(resolvedActivity.lastCheckedAt)} /> : null}
        {resolvedActivity?.blockNumber ? <InfoLine label="Block" value={String(resolvedActivity.blockNumber)} /> : null}
        {resolvedActivity?.confirmations ? <InfoLine label="Confirmations" value={String(resolvedActivity.confirmations)} /> : null}
        {resolvedActivity?.from ? <InfoLine label="From" value={shortAddress(resolvedActivity.from, 8, 6)} /> : null}
        {resolvedActivity?.to ? <InfoLine label="To" value={shortAddress(resolvedActivity.to, 8, 6)} /> : null}
        {resolvedActivity?.contractAddress ? <InfoLine label="Contract" value={shortAddress(resolvedActivity.contractAddress, 8, 6)} /> : null}
        {typeof resolvedActivity?.feeNative === 'number' ? <InfoLine label="Fee" value={`${formatTokenAmount(resolvedActivity.feeNative, 8)} ${displayChain.nativeCurrency.symbol}`} /> : null}
        <InfoLine label="Explorer" value="BscScan" />
      </View>

      {foundOnDifferentChain ? (
        <View style={styles.warningPanel}>
          <AlertTriangle color="#F3BA2F" size={18} />
          <AppText tone="muted">Found on {displayChain.shortName}. Switch network to use wallet actions.</AppText>
        </View>
      ) : null}

      <ActionRail
        items={[
          { icon: <Copy color="#C7FF3D" size={19} />, label: 'Copy hash', onPress: copyHash },
          ...(resolvedActivity?.counterparty ? [{ icon: <Copy color="#A5AEC0" size={19} />, label: 'Copy address', onPress: copyCounterparty }] : []),
          ...(resolvedActivity?.status === 'pending' ? [{ icon: <SlidersHorizontal color="#A5AEC0" size={19} />, label: isLookingUp ? 'Checking' : 'Refresh', onPress: refreshStatus }] : []),
          ...(foundOnDifferentChain ? [{ icon: <SlidersHorizontal color="#A5AEC0" size={19} />, label: 'Switch network', onPress: switchToActivityNetwork }] : []),
          ...(canDraftOutgoingAgain
            ? [
                {
                  href: {
                    pathname: '/send',
                    params: {
                      amount: String(resolvedActivity?.amount ?? ''),
                      asset: retryAssetId ?? '',
                      recipient: resolvedActivity?.to ?? '',
                      source: outgoingDraftSource,
                    },
                  } as Href,
                  icon: <ArrowUpRight color="#A5AEC0" size={19} />,
                  label: outgoingDraftLabel,
                },
              ]
            : []),
          { icon: <ExternalLink color="#A5AEC0" size={19} />, label: 'Explorer', onPress: openExplorer },
        ]}
      />

      <View style={styles.keyPanel}>
        <AppText tone="muted" variant="caption">
          Hash
        </AppText>
        <AppText variant="mono" style={styles.secretText}>
          {activity.hash}
        </AppText>
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
  actionOnPress,
  title,
}: {
  actionHref?: Href;
  actionIcon?: ReactNode;
  actionLabel?: string;
  actionOnPress?: () => void;
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
      ) : actionOnPress && content ? (
        <Pressable accessibilityRole="button" onPress={actionOnPress}>
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.emptyState}>
      <AppText tone="muted">{label}</AppText>
    </View>
  );
}

function InfoLine({ label, tone = 'primary', value }: { label: string; tone?: 'primary' | 'lime' | 'danger' | 'amber'; value: string }) {
  return (
    <View style={styles.infoLine}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText tone={tone} style={styles.infoValue}>
        {value}
      </AppText>
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

function matchesActivityFilter(activity: WalletActivity, query: string, filter: ActivityFilterValue) {
  if (filter === 'in' && activity.direction !== 'in') {
    return false;
  }

  if (filter === 'out' && activity.direction !== 'out') {
    return false;
  }

  if (filter === 'pending' && activity.status !== 'pending') {
    return false;
  }

  if (filter === 'failed' && activity.status !== 'failed') {
    return false;
  }

  const keyword = query.trim().toLowerCase();

  if (!keyword) {
    return true;
  }

  return [
    activity.title,
    activity.subtitle,
    activity.symbol,
    activity.hash,
    activity.from,
    activity.to,
    activity.counterparty,
    activity.contractAddress,
  ].some((value) => value?.toLowerCase().includes(keyword));
}

function getRecentRecipients(activities: WalletActivity[], chainId: SupportedChainId, activeAddress?: string) {
  const recipients = new Map<string, { address: string; label: string; meta: string }>();

  activities.forEach((activity) => {
    const address = activity.to ?? activity.counterparty;

    if (activity.chainId !== chainId || activity.direction !== 'out' || !address || !isAddress(address)) {
      return;
    }

    if (activeAddress && isSameAddress(address, activeAddress)) {
      return;
    }

    const key = address.toLowerCase();

    if (recipients.has(key)) {
      return;
    }

    recipients.set(key, {
      address,
      label: shortAddress(address, 8, 6),
      meta: `${activity.symbol} · ${getActivityStatusLabel(activity.status)}`,
    });
  });

  return [...recipients.values()].slice(0, 3);
}

function getActivityStatusLabel(status: WalletActivity['status']) {
  if (status === 'failed') {
    return 'Failed';
  }

  if (status === 'pending') {
    return 'Pending';
  }

  return 'Last sent';
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

function formatActivityDate(timestamp: string) {
  const activityDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (activityDate.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (activityDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return activityDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

function formatCheckedAt(timestamp: string) {
  const date = new Date(timestamp);

  if (!Number.isFinite(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  activityFilterButton: {
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activityFilterButtonActive: {
    backgroundColor: 'rgba(199,255,61,0.08)',
    borderColor: 'rgba(199,255,61,0.28)',
  },
  activityFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityDetailIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  activityDetailIn: {
    backgroundColor: 'rgba(199,255,61,0.08)',
  },
  activityDetailOut: {
    backgroundColor: 'rgba(243,186,47,0.08)',
  },
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
  assetOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  assetOptionActive: {
    borderColor: 'rgba(199,255,61,0.32)',
  },
  assetOptionCopy: {
    flex: 1,
    gap: 2,
  },
  assetOptionList: {
    gap: 8,
  },
  completionNotice: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  disabledButton: {
    opacity: 0.48,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
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
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  inlineActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  keyPanel: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  keyPanelTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  lookupButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(199,255,61,0.08)',
    borderColor: 'rgba(199,255,61,0.22)',
    borderRadius: 12,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  lookupInput: {
    flex: 1,
  },
  lookupInputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  lookupPanel: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  maxButton: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(199,255,61,0.24)',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  networkOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  networkOptionActive: {
    borderColor: 'rgba(199,255,61,0.32)',
  },
  networkOptionCopy: {
    flex: 1,
    gap: 2,
  },
  networkOptionDot: {
    backgroundColor: '#667085',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  networkOptionDotActive: {
    backgroundColor: '#C7FF3D',
  },
  networkOptionList: {
    gap: 8,
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
  qrPlaceholder: {
    alignItems: 'center',
    gap: 10,
    height: 190,
    justifyContent: 'center',
    width: 190,
  },
  receiveCard: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
  },
  recipientSuggestion: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  recipientSuggestionCopy: {
    flex: 1,
    gap: 2,
  },
  recipientSuggestionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(199,255,61,0.08)',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  recipientSuggestionList: {
    gap: 8,
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
  secretText: {
    flexShrink: 1,
    lineHeight: 20,
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
  warningCopy: {
    flex: 1,
    gap: 4,
  },
});
