import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  background: '#030612',
  backgroundElevated: '#08111f',
  backgroundSoft: '#101a2b',
  glass: 'rgba(12, 21, 38, 0.72)',
  glassStrong: 'rgba(18, 31, 52, 0.88)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(147, 197, 253, 0.26)',
  text: '#f8fbff',
  textMuted: '#99a7bd',
  textSubtle: '#6f8099',
  cyan: '#44d9ff',
  lime: '#b8ff5c',
  violet: '#9b7cff',
  rose: '#ff6b9a',
  amber: '#ffcc66',
  success: '#6ee7a7',
  danger: '#ff6b6b',
  warning: '#ffd166',
  black: '#000000',
  white: '#ffffff',
} as const;

export const gradients = {
  app: ['#02030a', '#051326', '#08111f'],
  life: ['#b8ff5c', '#44d9ff'],
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
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: 0,
  } satisfies TextStyle,
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 0,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: 0,
  } satisfies TextStyle,
};

export const shadows = {
  glowCyan: Platform.select({
    web: {
      boxShadow: '0 0 48px rgba(68, 217, 255, 0.18)',
    },
    default: {
      shadowColor: colors.cyan,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.18,
      shadowRadius: 32,
      elevation: 8,
    },
  }) as ViewStyle,
  card: Platform.select({
    web: {
      boxShadow: '0 20px 80px rgba(0, 0, 0, 0.32)',
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

