import { type ReactNode, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldAlert,
} from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Button } from '@/shared/ui/button';

type OnboardingStep =
  | 'welcome'
  | 'create-sheet'
  | 'google-picker'
  | 'create-password'
  | 'import-mnemonic'
  | 'import-password'
  | 'complete';

type CompletionKind = 'create' | 'import';

const GOOGLE_ACCOUNTS = [
  { email: 'lee@lifenetwork.app', initials: 'L', name: 'Life Member' },
  { email: 'wallet.user@gmail.com', initials: 'W', name: 'Wallet User' },
  { email: 'demo.account@gmail.com', initials: 'D', name: 'Demo Account' },
];

export function SignInPanel() {
  const { signInWithGoogle } = useAuthSession();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [completionKind, setCompletionKind] = useState<CompletionKind>('create');
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const wordCount = mnemonic.trim().split(/\s+/).filter(Boolean).length;
  const hasPasswordLength = password.length >= 8;
  const hasPasswordMix = /[a-z]/i.test(password) && /\d/.test(password);
  const passwordMatches = Boolean(password) && password === passwordConfirm;
  const canCompletePassword = hasPasswordLength && hasPasswordMix && passwordMatches;

  const showWelcome = step === 'welcome' || step === 'create-sheet' || step === 'google-picker';

  function resetPasswordFields() {
    setPassword('');
    setPasswordConfirm('');
  }

  function openCreateSheet() {
    resetPasswordFields();
    setCompletionKind('create');
    setStep('create-sheet');
  }

  function openImportFlow() {
    resetPasswordFields();
    setCompletionKind('import');
    setStep('import-mnemonic');
  }

  function goToPassword(nextKind: CompletionKind) {
    resetPasswordFields();
    setCompletionKind(nextKind);
    setStep(nextKind === 'create' ? 'create-password' : 'import-password');
  }

  function finishPassword() {
    if (canCompletePassword) {
      setStep('complete');
    }
  }

  function goBack() {
    if (step === 'import-mnemonic') {
      setStep('welcome');
      return;
    }

    if (step === 'create-password') {
      setStep('google-picker');
      return;
    }

    if (step === 'import-password') {
      setStep('import-mnemonic');
      return;
    }

    setStep('welcome');
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, showWelcome && styles.welcomeScrollContent]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {showWelcome ? (
            <WelcomeStage onCreate={openCreateSheet} onImport={openImportFlow} />
          ) : (
            <View style={styles.stepScreen}>
              <StepTopBar onBack={goBack} />
              {step === 'create-password' && (
                <PasswordStage
                  canContinue={canCompletePassword}
                  confirmValue={passwordConfirm}
                  hasLength={hasPasswordLength}
                  hasMatch={passwordMatches}
                  hasMix={hasPasswordMix}
                  onConfirmChange={setPasswordConfirm}
                  onContinue={finishPassword}
                  onPasswordChange={setPassword}
                  passwordValue={password}
                  submitLabel="비밀번호 설정"
                  title="지갑 보호 비밀번호 설정"
                  subtitle="이 기기에서 LIFE NETWORK를 잠금 해제할 때 사용합니다."
                />
              )}
              {step === 'import-mnemonic' && (
                <MnemonicStage
                  mnemonic={mnemonic}
                  onChangeMnemonic={setMnemonic}
                  onContinue={() => goToPassword('import')}
                  wordCount={wordCount}
                />
              )}
              {step === 'import-password' && (
                <PasswordStage
                  canContinue={canCompletePassword}
                  confirmValue={passwordConfirm}
                  hasLength={hasPasswordLength}
                  hasMatch={passwordMatches}
                  hasMix={hasPasswordMix}
                  onConfirmChange={setPasswordConfirm}
                  onContinue={finishPassword}
                  onPasswordChange={setPassword}
                  passwordValue={password}
                  submitLabel="가져오기 완료"
                  title="가져온 지갑 보호"
                  subtitle="이 지갑을 LIFE NETWORK에서 열 때 사용할 비밀번호를 설정하세요."
                />
              )}
              {step === 'complete' && (
                <CompleteStage completionKind={completionKind} onEnterWallet={signInWithGoogle} />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {step === 'create-sheet' && (
        <CreateWalletSheet
          onClose={() => setStep('welcome')}
          onContinue={() => setStep('google-picker')}
        />
      )}
      {step === 'google-picker' && (
        <GoogleAccountSheet
          onBack={() => setStep('create-sheet')}
          onClose={() => setStep('welcome')}
          onSelectAccount={() => goToPassword('create')}
        />
      )}
    </View>
  );
}

function WelcomeStage({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <View style={styles.welcome}>
      <View style={styles.brandArea}>
        <LifeNetworkLogo />
      </View>

      <View style={styles.actionArea}>
        <View style={styles.actionStack}>
          <Pressable
            accessibilityRole="button"
            onPress={onCreate}
            style={({ pressed }) => [styles.primaryChoice, pressed && styles.choicePressed]}>
            <AppText style={[styles.choiceLabel, styles.primaryChoiceText]}>신규 지갑 생성</AppText>
            <ArrowRight color={colors.black} size={18} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onImport}
            style={({ pressed }) => [styles.secondaryChoice, pressed && styles.choicePressed]}>
            <AppText style={styles.choiceLabel}>기존 지갑 연결</AppText>
            <ArrowRight color={colors.textMuted} size={18} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LifeNetworkLogo() {
  return (
    <View accessibilityLabel="LIFE NETWORK 로고" accessible style={styles.logoTile}>
      <Svg height={86} viewBox="0 0 160 86" width={160}>
        <SvgText
          fill="#f4f7fb"
          fontSize="34"
          fontWeight="900"
          letterSpacing={2}
          textAnchor="middle"
          transform="skewX(-10)"
          x="80"
          y="44">
          LIFE
        </SvgText>
        <Path
          d="M31 42 C54 34 82 34 130 40"
          fill="none"
          stroke={colors.lime}
          strokeLinecap="round"
          strokeWidth={4}
        />
        <SvgText
          fill={colors.lime}
          fontSize="11"
          fontWeight="700"
          letterSpacing={4}
          textAnchor="middle"
          x="80"
          y="67">
          NETWORK
        </SvgText>
      </Svg>
    </View>
  );
}

function StepTopBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.stepTopBar}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <ArrowLeft color={colors.text} size={18} />
      </Pressable>
      <AppText style={styles.topBrandText}>LIFE NETWORK</AppText>
    </View>
  );
}

function CreateWalletSheet({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  return (
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.overlayDismiss} />
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetCopy}>
          <AppText style={styles.sheetTitle}>신규 지갑 생성</AppText>
          <AppText tone="muted" style={styles.sheetBody}>
            Google 계정으로 LIFE NETWORK 지갑을 준비합니다.
          </AppText>
        </View>
        <Button icon={<Mail color={colors.black} size={18} />} label="Google로 계속하기" onPress={onContinue} />
        <Button label="취소" onPress={onClose} variant="ghost" />
      </View>
    </View>
  );
}

function GoogleAccountSheet({
  onBack,
  onClose,
  onSelectAccount,
}: {
  onBack: () => void;
  onClose: () => void;
  onSelectAccount: () => void;
}) {
  return (
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.overlayDismiss} />
      <View style={styles.accountSheet}>
        <View style={styles.modalHeader}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.modalBackButton}>
            <ArrowLeft color={colors.text} size={18} />
          </Pressable>
          <AppText style={styles.sheetTitle}>Google 계정 선택</AppText>
        </View>
        <AppText tone="muted" style={styles.sheetBody}>
          지갑 생성에 사용할 계정을 선택하세요.
        </AppText>
        <View style={styles.accountList}>
          {GOOGLE_ACCOUNTS.map((account) => (
            <Pressable
              accessibilityRole="button"
              key={account.email}
              onPress={onSelectAccount}
              style={({ pressed }) => [styles.accountRow, pressed && styles.rowPressed]}>
              <View style={styles.avatar}>
                <AppText style={styles.avatarText}>{account.initials}</AppText>
              </View>
              <View style={styles.accountCopy}>
                <AppText style={styles.accountName}>{account.name}</AppText>
                <AppText tone="muted" style={styles.accountEmail}>
                  {account.email}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onSelectAccount}
          style={({ pressed }) => [styles.useAnotherRow, pressed && styles.rowPressed]}>
          <Mail color={colors.textMuted} size={18} />
          <AppText style={styles.useAnotherText}>다른 계정 사용</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function MnemonicStage({
  mnemonic,
  onChangeMnemonic,
  onContinue,
  wordCount,
}: {
  mnemonic: string;
  onChangeMnemonic: (value: string) => void;
  onContinue: () => void;
  wordCount: number;
}) {
  const canContinue = wordCount === 12 || wordCount === 24;

  return (
    <View style={styles.formStage}>
      <StepHeader
        icon={<KeyRound color={colors.cyan} size={20} />}
        subtitle="복구 구문으로 사용 중인 BSC 지갑을 가져옵니다."
        title="기존 지갑 연결"
      />

      <View style={styles.warningBox}>
        <ShieldAlert color={colors.warning} size={18} />
        <AppText tone="warning" style={styles.warningText}>
          복구 구문은 누구에게도 공유하지 마세요.
        </AppText>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabelRow}>
          <AppText style={styles.fieldLabelText}>Recovery phrase</AppText>
          <AppText tone={canContinue ? 'lime' : 'subtle'} style={styles.fieldCounter}>
            {wordCount}/12 or 24
          </AppText>
        </View>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={5}
          onChangeText={onChangeMnemonic}
          placeholder="12 또는 24개 단어를 입력하세요"
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, styles.mnemonicInput]}
          value={mnemonic}
        />
      </View>

      <Button disabled={!canContinue} label="다음" onPress={onContinue} />
    </View>
  );
}

function PasswordStage({
  canContinue,
  confirmValue,
  hasLength,
  hasMatch,
  hasMix,
  onConfirmChange,
  onContinue,
  onPasswordChange,
  passwordValue,
  submitLabel,
  subtitle,
  title,
}: {
  canContinue: boolean;
  confirmValue: string;
  hasLength: boolean;
  hasMatch: boolean;
  hasMix: boolean;
  onConfirmChange: (value: string) => void;
  onContinue: () => void;
  onPasswordChange: (value: string) => void;
  passwordValue: string;
  submitLabel: string;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.formStage}>
      <StepHeader icon={<LockKeyhole color={colors.lime} size={20} />} subtitle={subtitle} title={title} />

      <View style={styles.fieldGroup}>
        <AppText style={styles.fieldLabelText}>비밀번호</AppText>
        <TextInput
          onChangeText={onPasswordChange}
          placeholder="8자 이상"
          placeholderTextColor={colors.textSubtle}
          secureTextEntry
          style={styles.input}
          value={passwordValue}
        />
      </View>

      <View style={styles.fieldGroup}>
        <AppText style={styles.fieldLabelText}>비밀번호 확인</AppText>
        <TextInput
          onChangeText={onConfirmChange}
          placeholder="다시 입력"
          placeholderTextColor={colors.textSubtle}
          secureTextEntry
          style={styles.input}
          value={confirmValue}
        />
      </View>

      <View style={styles.checkList}>
        <Requirement checked={hasLength} label="8자 이상" />
        <Requirement checked={hasMix} label="영문/숫자 조합" />
        <Requirement checked={hasMatch} label="비밀번호 일치" />
      </View>

      <Button disabled={!canContinue} label={submitLabel} onPress={onContinue} />
    </View>
  );
}

function CompleteStage({
  completionKind,
  onEnterWallet,
}: {
  completionKind: CompletionKind;
  onEnterWallet: () => Promise<void>;
}) {
  const created = completionKind === 'create';

  return (
    <View style={styles.completeStage}>
      <CheckCircle2 color={colors.lime} size={42} />
      <View style={styles.completeCopy}>
        <AppText style={styles.completeTitle}>
          {created ? '지갑이 준비되었습니다' : '지갑이 연결되었습니다'}
        </AppText>
        <AppText tone="muted" style={styles.completeBody}>
          {created ? 'LIFE NETWORK 지갑을 사용할 수 있습니다.' : '기존 지갑을 사용할 수 있습니다.'}
        </AppText>
      </View>
      <Button label="월렛으로 이동" onPress={onEnterWallet} />
    </View>
  );
}

function StepHeader({ icon, subtitle, title }: { icon: ReactNode; subtitle: string; title: string }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.stepIcon}>{icon}</View>
      <View style={styles.stepCopy}>
        <AppText style={styles.stepTitle}>{title}</AppText>
        <AppText tone="muted" style={styles.stepSubtitle}>
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

function Requirement({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={styles.requirement}>
      <View style={[styles.requirementDot, checked && styles.requirementDotActive]} />
      <AppText tone={checked ? 'lime' : 'muted'} style={styles.requirementText}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#05070b',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  welcomeScrollContent: {
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    flex: 1,
  },
  welcome: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xl,
    minHeight: 560,
  },
  brandArea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: spacing.xxl,
  },
  logoTile: {
    width: 174,
    height: 174,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#07111d',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.28)',
      },
      default: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  actionArea: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  actionStack: {
    width: '100%',
    maxWidth: 276,
    gap: spacing.sm,
  },
  primaryChoice: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.lime,
    borderWidth: 1,
    borderColor: 'rgba(232, 255, 190, 0.52)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryChoice: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#111827',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  choicePressed: {
    opacity: 0.82,
  },
  choiceLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  primaryChoiceText: {
    color: colors.black,
  },
  stepScreen: {
    gap: spacing.xxl,
    paddingTop: spacing.md,
  },
  stepTopBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#111827',
  },
  topBrandText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayDismiss: {
    flex: 1,
  },
  bottomSheet: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    gap: spacing.lg,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: '#0b1220',
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  accountSheet: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    gap: spacing.md,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: '#0b1220',
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  sheetCopy: {
    gap: spacing.xs,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  sheetBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalBackButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#111827',
  },
  accountList: {
    gap: spacing.sm,
  },
  accountRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#111827',
    paddingHorizontal: spacing.md,
  },
  rowPressed: {
    backgroundColor: '#162033',
  },
  avatar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  avatarText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  accountEmail: {
    fontSize: 13,
    lineHeight: 18,
  },
  useAnotherRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  useAnotherText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  formStage: {
    gap: spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 102, 0.26)',
    backgroundColor: '#171512',
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fieldLabelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  fieldCounter: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  input: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#111827',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: '600',
  },
  mnemonicInput: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  checkList: {
    gap: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0b1220',
    padding: spacing.md,
  },
  requirement: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSubtle,
  },
  requirementDotActive: {
    backgroundColor: colors.lime,
  },
  requirementText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  completeStage: {
    minHeight: 420,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  completeCopy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  completeTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
  completeBody: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
