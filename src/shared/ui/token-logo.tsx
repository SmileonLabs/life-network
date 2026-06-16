import { Image, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

const bnbTokenIcon = require('../../../assets/images/tokens/bnb.png');

type TokenLogoProps = {
  symbol: string;
  accent?: string;
  size?: number;
};

export function TokenLogo({ symbol, accent = colors.cyan, size = 44 }: TokenLogoProps) {
  const isBnbAsset = symbol === 'BNB' || symbol === 'tBNB';

  if (isBnbAsset) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={bnbTokenIcon}
        style={[styles.image, { width: size, height: size }]}
      />
    );
  }

  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size / 2, borderColor: accent }]}>
      <AppText style={[styles.symbol, { color: accent }]}>{symbol.slice(0, 1)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: radius.round,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderRadius: radius.round,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '900',
  },
});
