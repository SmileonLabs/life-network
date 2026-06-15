export const env = {
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
  privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? '',
  lifeTokenAddress: process.env.EXPO_PUBLIC_LIFE_TOKEN_ADDRESS ?? '',
  explorerApiKey: process.env.EXPO_PUBLIC_EXPLORER_API_KEY ?? '',
};

export const isDemoMode = !env.privyAppId || !env.privyClientId;

