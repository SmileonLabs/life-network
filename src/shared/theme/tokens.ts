import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  background: '#FAF8F4',
  backgroundElevated: '#F5F1EA',
  backgroundSoft: '#EFEAE0',
  glass: 'rgba(250, 248, 244, 0.86)',
  glassStrong: 'rgba(255, 255, 255, 0.94)',
  border: 'rgba(31, 27, 22, 0.1)',
  borderStrong: 'rgba(31, 27, 22, 0.22)',
  text: '#1F1B16',
  textMuted: '#4F4940',
  textSubtle: '#79736B',
  cyan: '#00D68F',
  accent: '#E1F432',
  accentInk: '#07111F',
  lime: '#C76A3C',
  violet: '#75584A',
  rose: '#BA1A1A',
  amber: '#E2B243',
  success: '#00A544',
  danger: '#BA1A1A',
  warning: '#C76A3C',
  black: '#000000',
  white: '#ffffff',
} as const;

export const gradients = {
  app: ['#FAF8F4', '#F5F1EA', '#EFEAE0'],
  life: ['#F4D9C6', '#C76A3C'],
} as const;

export const fonts = {
  display: 'PretendardVariable',
  light: 'PretendardVariable',
  regular: 'PretendardVariable',
  semibold: 'PretendardVariable',
  bold: 'PretendardVariable',
  black: 'PretendardVariable',
  latinDisplay: 'Lato-Light',
  latinRegular: 'Lato-Regular',
  latinSemibold: 'Lato-Semibold',
  latinBold: 'Lato-Bold',
  latinBlack: 'Lato-Black',
  mono: Platform.select({ default: 'monospace', ios: 'Menlo' }) ?? 'monospace',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  round: 999,
} as const;

export const typography = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '400',
    letterSpacing: 0,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: 0,
  } satisfies TextStyle,
  subtitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 0,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: 0,
  } satisfies TextStyle,
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: 0,
  } satisfies TextStyle,
};

export const shadows = {
  glowCyan: Platform.select({
    web: {
      boxShadow: '0 0 48px rgba(199, 106, 60, 0.12)',
    },
    default: {
      shadowColor: colors.lime,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.18,
      shadowRadius: 32,
      elevation: 8,
    },
  }) as ViewStyle,
  card: Platform.select({
    web: {
      boxShadow: '0 18px 48px rgba(31, 27, 22, 0.12)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.24,
      shadowRadius: 26,
      elevation: 9,
    },
  }) as ViewStyle,
};

export const glassEffect = Platform.select({
  web: {
    backdropFilter: 'blur(24px)',
  },
  default: {},
}) as ViewStyle;
