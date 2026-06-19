import { StyleSheet, View } from 'react-native';

import { AppScreen, AppText } from '@/features/mock-wallet/ui';

export default function AuthCallbackScreen() {
  return (
    <AppScreen scroll={false}>
      <View style={styles.root}>
        <AppText variant="brand" style={styles.brand}>
          LIFE NETWORK
        </AppText>
        <AppText tone="muted" style={styles.message}>
          Completing sign-in
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: 17,
    letterSpacing: 1.5,
  },
  message: {
    fontSize: 13,
  },
  root: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
});
