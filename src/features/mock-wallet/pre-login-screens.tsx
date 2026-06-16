import { ArrowRight, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import {
  AppScreen,
  AppText,
  triggerNativeFeedback,
} from '@/features/mock-wallet/ui';

export function WelcomeScreen() {
  const { isReady, signInWithGoogle } = useAuthSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const continueWithGoogle = async () => {
    if (!isReady || isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error));
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
            style={({ pressed }) => [
              styles.entryButton,
              styles.primaryEntry,
              (!isReady || isSigningIn) && styles.disabledEntry,
              pressed && isReady && !isSigningIn && styles.entryPressed,
            ]}
            onPressIn={() => triggerNativeFeedback('impact')}
            onPress={continueWithGoogle}>
            <View style={styles.googleButtonCopy}>
              <Mail color="#07100B" size={17} />
              <AppText style={styles.primaryEntryText}>Continue with Google</AppText>
            </View>
            <ArrowRight color="#07100B" size={18} />
          </Pressable>
          {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
        </View>
      </View>
    </AppScreen>
  );
}

function getSignInErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message.toLowerCase().includes('google') && message.toLowerCase().includes('not allowed')) {
    return 'Google sign-in is not enabled.';
  }

  return 'Sign-in failed.';
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
  entryPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabledEntry: {
    opacity: 0.62,
  },
  googleButtonCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 2,
    textAlign: 'center',
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
