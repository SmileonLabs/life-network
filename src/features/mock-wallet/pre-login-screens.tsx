import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Check, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Wallet } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { mockAddress, mockWallets } from '@/features/mock-wallet/data';
import {
  AppButton,
  AppInput,
  AppScreen,
  AppText,
  BottomSheet,
  FloatingBottomActions,
  NetworkBadge,
  PasswordDots,
  icons,
  shortAddress,
} from '@/features/mock-wallet/ui';

type CreateStep = 'google' | 'password';
type ImportStep = 'mnemonic' | 'password';

export function WelcomeScreen() {
  const router = useRouter();
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const continueWithGoogle = () => {
    setShowCreateSheet(false);
    router.replace('/onboarding/create?step=password');
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
            accessibilityLabel="Create New Wallet"
            accessibilityRole="button"
            style={StyleSheet.flatten([styles.entryButton, styles.primaryEntry])}
            onPress={() => setShowCreateSheet(true)}>
            <AppText style={styles.primaryEntryText}>Create New Wallet</AppText>
            <ArrowRight color="#07100B" size={18} />
          </Pressable>
          <Link href="/onboarding/import" asChild>
            <Pressable style={styles.entryButton}>
              <AppText>Connect Existing Wallet</AppText>
              <ArrowRight color="#A5AEC0" size={18} />
            </Pressable>
          </Link>
        </View>
      </View>
      <BottomSheet title="Google sign in" visible={showCreateSheet} onClose={() => setShowCreateSheet(false)}>
        <AppButton icon={<Mail color="#F7FAFF" size={18} />} onPress={continueWithGoogle}>
          Continue with Google
        </AppButton>
        <AppButton tone="secondary" onPress={() => setShowCreateSheet(false)}>
          Cancel
        </AppButton>
      </BottomSheet>
    </AppScreen>
  );
}

export function CreateWalletScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<CreateStep>(params.step === 'password' ? 'password' : 'google');
  const [showReadySheet, setShowReadySheet] = useState(false);
  const showGoogleSheet = step === 'google';

  return (
    <AppScreen
      fixedBottom={
        step === 'password' ? (
          <FloatingBottomActions
            primary={
              <AppButton style={styles.flexButton} onPress={() => setShowReadySheet(true)}>
                Create Wallet
              </AppButton>
            }
          />
        ) : undefined
      }
      backHref="/sign-in"
      title="Create wallet">
      <View style={styles.stepHeader}>
        <Wallet color="#C7FF3D" size={26} />
        <AppText variant="title">New LIFE wallet</AppText>
      </View>

      {step === 'password' ? (
        <View style={styles.formStack}>
          <AppInput icon={<LockKeyhole color="#667085" size={18} />} placeholder="Password" secureTextEntry />
          <AppInput icon={<LockKeyhole color="#667085" size={18} />} placeholder="Confirm password" secureTextEntry />
          <View style={styles.noteRow}>
            <ShieldCheck color="#C7FF3D" size={17} />
            <AppText tone="muted" variant="caption">
              Used to unlock this app.
            </AppText>
          </View>
        </View>
      ) : null}

      <BottomSheet title="Google sign in" visible={showGoogleSheet} onClose={() => setStep('password')}>
        <AppButton icon={<Mail color="#F7FAFF" size={18} />} onPress={() => setStep('password')}>
          Continue with Google
        </AppButton>
        <AppButton tone="secondary" onPress={() => router.back()}>
          Cancel
        </AppButton>
      </BottomSheet>
      <BottomSheet title="Wallet ready" visible={showReadySheet} onClose={() => setShowReadySheet(false)}>
        <CompletionSheetContent
          address={mockAddress}
          source="Google embedded wallet"
          walletName="LIFE Main Wallet"
          onOpen={() => router.replace('/')}
        />
      </BottomSheet>
    </AppScreen>
  );
}

export function ImportWalletScreen() {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('mnemonic');
  const [showConnectedSheet, setShowConnectedSheet] = useState(false);
  const words = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

  return (
    <AppScreen
      fixedBottom={
        <FloatingBottomActions
          primary={
            <AppButton style={styles.flexButton} onPress={() => (step === 'mnemonic' ? setStep('password') : setShowConnectedSheet(true))}>
              {step === 'mnemonic' ? 'Continue' : 'Connect Wallet'}
            </AppButton>
          }
        />
      }
      backHref="/sign-in"
      title="Connect wallet">
      {step === 'mnemonic' ? (
        <>
          <View style={styles.stepHeader}>
            <KeyRound color="#C7FF3D" size={26} />
            <AppText variant="title">Recovery phrase</AppText>
          </View>
          <View style={styles.wordGrid}>
            {words.map((word) => (
              <View style={styles.wordInput} key={word}>
                <AppText tone="subtle" variant="mono">
                  {word}.
                </AppText>
                <AppText tone="muted" variant="mono">
                  word
                </AppText>
              </View>
            ))}
          </View>
          <View style={styles.warningRow}>
            <EyeOff color="#F3BA2F" size={17} />
            <AppText tone="muted" variant="caption">
              Never share your recovery phrase.
            </AppText>
          </View>
        </>
      ) : null}

      {step === 'password' ? (
        <View style={styles.formStack}>
          <View style={styles.stepHeader}>
            <LockKeyhole color="#C7FF3D" size={26} />
            <AppText variant="title">Set password</AppText>
          </View>
          <AppInput icon={<LockKeyhole color="#667085" size={18} />} placeholder="Password" secureTextEntry />
          <AppInput icon={<LockKeyhole color="#667085" size={18} />} placeholder="Confirm password" secureTextEntry />
        </View>
      ) : null}

      <BottomSheet title="Wallet connected" visible={showConnectedSheet} onClose={() => setShowConnectedSheet(false)}>
        <CompletionSheetContent
          address={mockWallets[1].address}
          source="Mnemonic wallet"
          walletName="Imported Wallet"
          onOpen={() => router.replace('/')}
        />
      </BottomSheet>
    </AppScreen>
  );
}

function CompletionSheetContent({
  address,
  onOpen,
  source,
  walletName,
}: {
  address: string;
  onOpen: () => void;
  source: string;
  walletName: string;
}) {
  return (
    <View style={styles.completionStack}>
      <View style={styles.completionStatus}>
        <View style={styles.completeMark}>
          <Check color="#C7FF3D" size={22} />
        </View>
        <View style={styles.completionStatusCopy}>
          <AppText>{walletName}</AppText>
          <AppText tone="muted" variant="caption">
            {source}
          </AppText>
        </View>
      </View>

      <View style={styles.completionCard}>
        <View style={styles.completionRow}>
          <View style={styles.completionIcon}>
            <Wallet color="#C7FF3D" size={17} />
          </View>
          <View style={styles.completionText}>
            <AppText variant="caption" tone="muted">
              Address
            </AppText>
            <AppText variant="mono">{shortAddress(address)}</AppText>
          </View>
        </View>
        <View style={styles.completionDivider} />
        <View style={styles.completionRow}>
          <View style={styles.completionIcon}>
            <ShieldCheck color="#C7FF3D" size={17} />
          </View>
          <View style={styles.completionText}>
            <AppText variant="caption" tone="muted">
              Protection
            </AppText>
            <AppText>Password enabled</AppText>
          </View>
        </View>
        <View style={styles.completionDivider} />
        <View style={styles.completionRow}>
          <View style={styles.completionIcon}>
            <icons.Wallet color="#F3BA2F" size={17} />
          </View>
          <View style={styles.completionText}>
            <AppText variant="caption" tone="muted">
              Network
            </AppText>
            <AppText>BNB Smart Chain</AppText>
          </View>
          <View style={styles.completionBadge}>
            <AppText variant="caption" tone="amber">
              BSC
            </AppText>
          </View>
        </View>
      </View>

      <AppButton onPress={onOpen}>Open Wallet</AppButton>
    </View>
  );
}

export function UnlockScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll={false}>
      <View style={styles.unlock}>
        <View style={styles.logoSmall}>
          <AppText variant="brand">LIFE</AppText>
          <AppText tone="muted" variant="caption">
            NETWORK
          </AppText>
        </View>
        <PasswordDots count={4} />
        <AppButton style={styles.fullButton} onPress={() => router.replace('/')}>
          Unlock
        </AppButton>
        <View style={styles.unlockMeta}>
          <NetworkBadge />
          <View style={styles.networkBadgeLite}>
            <icons.Wallet color="#A5AEC0" size={16} />
            <AppText tone="muted" variant="caption">
              0x7A04...B91F
            </AppText>
          </View>
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
  completeMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(199, 255, 61, 0.08)',
    borderColor: 'rgba(199, 255, 61, 0.28)',
    borderRadius: 16,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  completionBadge: {
    backgroundColor: 'rgba(243, 186, 47, 0.08)',
    borderColor: 'rgba(243, 186, 47, 0.22)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  completionDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    height: 1,
    marginLeft: 44,
  },
  completionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 11,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  completionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
  },
  completionStack: {
    gap: 14,
  },
  completionStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  completionStatusCopy: {
    flex: 1,
    gap: 2,
  },
  completionText: {
    flex: 1,
    gap: 2,
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
  flexButton: {
    flex: 1,
  },
  formStack: {
    gap: 12,
  },
  fullButton: {
    width: '100%',
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
  logoSmall: {
    alignItems: 'center',
    gap: 2,
  },
  logoSub: {
    letterSpacing: 4,
  },
  logoText: {
    fontSize: 34,
    letterSpacing: 2,
    lineHeight: 40,
  },
  networkBadgeLite: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  noteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  primaryEntry: {
    backgroundColor: '#C7FF3D',
    borderColor: '#C7FF3D',
  },
  primaryEntryText: {
    color: '#07100B',
  },
  stepHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  unlock: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  unlockMeta: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  warningRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  welcome: {
    flex: 1,
    paddingHorizontal: 14,
  },
  welcomeActions: {
    gap: 12,
    paddingBottom: 34,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordInput: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: '31.5%',
    flexDirection: 'row',
    gap: 7,
    minHeight: 46,
    paddingHorizontal: 10,
  },
});
