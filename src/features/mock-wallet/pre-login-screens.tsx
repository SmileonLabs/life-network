import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { AppText, triggerNativeFeedback } from '@/features/mock-wallet/ui';
import { fonts } from '@/shared/theme/tokens';

const loginBackground = require('../../../assets/images/generated/life-web3-login-bg.png');
const lifeTokenObject = require('../../../assets/images/generated/life-token-object.png');

export function WelcomeScreen() {
  const { error, isReady, signInWithGoogle } = useAuthSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const visibleErrorMessage = errorMessage ?? (error ? normalizeAuthError(error) : null);
  const continueWithGoogle = async () => {
    if (isSigningIn) {
      return;
    }

    if (!isReady) {
      setErrorMessage('Google sign-in is still preparing.');
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
    <ImageBackground resizeMode="cover" source={loginBackground} style={styles.loginBackground}>
      <View style={styles.depthOverlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.welcome}>
          <View style={styles.hero}>
            <Image accessibilityIgnoresInvertColors resizeMode="contain" source={lifeTokenObject} style={styles.tokenObject} />
            <AppText style={styles.headline}>
              Health,{'\n'}seen through{'\n'}your daily data
            </AppText>
          </View>
          <View style={styles.welcomeActions}>
            <Pressable
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
              disabled={isSigningIn}
              onPress={continueWithGoogle}
              onPressIn={() => triggerNativeFeedback('impact')}
              style={({ pressed }) => [
                styles.googleButtonPressable,
                isSigningIn && styles.googleButtonDisabled,
                pressed && !isSigningIn && styles.googleButtonPressed,
              ]}>
              <View style={styles.googleButtonSurface}>
                <AppText style={styles.primaryEntryText}>
                  {isSigningIn ? 'Opening Google' : 'Continue with Google'}
                </AppText>
                <View style={styles.loginButtonArrow}>
                  <ArrowRight color="#07111F" size={18} />
                </View>
              </View>
            </Pressable>
            {visibleErrorMessage ? <AppText style={styles.errorText}>{visibleErrorMessage}</AppText> : null}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function getSignInErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message.toLowerCase().includes('google') && message.toLowerCase().includes('not allowed')) {
    return 'Google sign-in is not enabled.';
  }

  return message || 'Sign-in failed.';
}

function normalizeAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('cancel')) {
    return 'Google sign-in was cancelled.';
  }

  if (normalized.includes('not allowed')) {
    return 'Google sign-in is not enabled.';
  }

  return message;
}

const styles = StyleSheet.create({
  depthOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 8, 18, 0.24)',
  },
  headline: {
    color: '#F8FAFF',
    fontFamily: fonts.latinBlack,
    fontSize: 43,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 50,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 34,
  },
  loginBackground: {
    backgroundColor: '#020814',
    flex: 1,
  },
  googleButtonPressable: {
    width: '100%',
    zIndex: 3,
  },
  googleButtonSurface: {
    alignItems: 'center',
    backgroundColor: '#DDF421',
    borderColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 999,
    borderWidth: 1,
    elevation: 8,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#DDF421',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    width: '100%',
  },
  googleButtonDisabled: {
    opacity: 0.72,
  },
  googleButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  loginButtonArrow: {
    position: 'absolute',
    right: 18,
  },
  primaryEntryText: {
    color: '#07111F',
    fontFamily: fonts.latinBold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  safeArea: {
    flex: 1,
  },
  tokenObject: {
    height: 176,
    marginBottom: 18,
    width: 176,
  },
  errorText: {
    color: '#FFB4AB',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  welcome: {
    flex: 1,
    paddingHorizontal: 26,
  },
  welcomeActions: {
    gap: 12,
    paddingBottom: 74,
    zIndex: 2,
  },
});
