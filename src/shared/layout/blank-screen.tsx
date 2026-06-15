import { StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';

export function BlankScreen() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
