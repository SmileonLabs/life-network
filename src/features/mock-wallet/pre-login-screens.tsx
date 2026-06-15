import { useRouter } from 'expo-router';
import { ArrowRight, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import {
  AppScreen,
  AppText,
} from '@/features/mock-wallet/ui';

export function WelcomeScreen() {
  const router = useRouter();
  const { isReady, signInWithGoogle } = useAuthSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const continueWithGoogle = async () => {
    if (!isReady || isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      router.replace('/');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <AppScreen scroll={false}>
      <View style={styles.welcome}>
        <View style={styles.brandBlock}>
          <View style={styles.logoPlate}>
            <AppText variant="brand" style={styles.logoText}>
              LIFE
            </AppText>
            <AppText variant="caption" style={styles.logoSub}>
              NETWORK
            </AppText>
          </View>
        </View>
        <View style={styles.welcomeActions}>
          <Pressable
            accessibilityLabel="Continue with Google"
            accessibilityRole="button"
            disabled={!isReady || isSigningIn}
            style={StyleSheet.flatten([styles.entryButton, styles.primaryEntry, (!isReady || isSigningIn) && styles.disabledEntry])}
            onPress={continueWithGoogle}>
            <View style={styles.googleButtonCopy}>
              <Mail color="#07100B" size={17} />
              <AppText style={styles.primaryEntryText}>Continue with Google</AppText>
            </View>
            <ArrowRight color="#07100B" size={18} />
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  brandBlock: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  entryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.065)',
    borderColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  disabledEntry: {
    opacity: 0.62,
  },
  googleButtonCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  logoPlate: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 8, 18, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    height: 172,
    justifyContent: 'center',
    width: 172,
  },
  logoSub: {
    letterSpacing: 4,
  },
  logoText: {
    fontSize: 34,
    letterSpacing: 2,
    lineHeight: 40,
  },
  primaryEntry: {
    backgroundColor: '#C7FF3D',
    borderColor: '#C7FF3D',
  },
  primaryEntryText: {
    color: '#07100B',
  },
  welcome: {
    flex: 1,
    paddingHorizontal: 14,
  },
  welcomeActions: {
    gap: 12,
    marginTop: 44,
    paddingBottom: 34,
  },
});
