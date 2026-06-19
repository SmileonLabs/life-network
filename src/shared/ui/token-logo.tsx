import { useState } from 'react';
import { CircleDollarSign } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { getKnownTokenByMint, getKnownTokenBySymbol } from '@/shared/config/token-registry';
import { colors, radius } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

const solanaTokenIcon = require('../../../assets/images/tokens/solana.png');
const lifeTokenIcon = require('../../../assets/images/lns-mark.png');

type TokenLogoProps = {
  symbol: string;
  accent?: string;
  iconUrl?: string;
  mint?: string;
  size?: number;
};

export function TokenLogo({ symbol, accent = colors.cyan, iconUrl, mint, size = 44 }: TokenLogoProps) {
  const [remoteFailed, setRemoteFailed] = useState(false);
  const normalizedSymbol = symbol.toUpperCase();
  const knownToken = getKnownTokenByMint(101, mint) ?? getKnownTokenByMint(103, mint) ?? getKnownTokenBySymbol(symbol);

  if (normalizedSymbol === 'LIFE') {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={lifeTokenIcon}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  if (normalizedSymbol === 'SOL') {
    return (
      <View style={[styles.solLogo, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={solanaTokenIcon}
          style={{ width: size * 0.66, height: size * 0.66 }}
        />
      </View>
    );
  }

  if (knownToken?.icon === 'usdc') {
    return (
      <View style={[styles.usdcLogo, { width: size, height: size, borderRadius: size / 2 }]}>
        <CircleDollarSign color={colors.white} size={size * 0.58} strokeWidth={2.2} />
      </View>
    );
  }

  if (iconUrl && isHttpUrl(iconUrl) && !remoteFailed) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        onError={() => setRemoteFailed(true)}
        source={{ uri: iconUrl }}
        style={[styles.remoteImage, { width: size, height: size, borderRadius: size / 2, borderColor: accent }]}
      />
    );
  }

  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size / 2, borderColor: accent }]}>
      <AppText style={[styles.symbol, { color: accent }]}>{symbol.slice(0, 1)}</AppText>
    </View>
  );
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.backgroundElevated,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderRadius: radius.round,
  },
  solLogo: {
    alignItems: 'center',
    backgroundColor: colors.black,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  remoteImage: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '900',
  },
  usdcLogo: {
    alignItems: 'center',
    backgroundColor: '#2775CA',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
