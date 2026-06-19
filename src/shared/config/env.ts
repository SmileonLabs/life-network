const legacyPrivyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? '';

export const env = {
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
  privyMobileClientId: process.env.EXPO_PUBLIC_PRIVY_MOBILE_CLIENT_ID ?? legacyPrivyClientId,
  privyWebClientId: process.env.EXPO_PUBLIC_PRIVY_WEB_CLIENT_ID ?? legacyPrivyClientId,
  lifeTokenMint: process.env.EXPO_PUBLIC_LIFE_TOKEN_MINT ?? '',
  lifeTokenAddress: process.env.EXPO_PUBLIC_LIFE_TOKEN_ADDRESS ?? '',
  explorerApiKey: process.env.EXPO_PUBLIC_EXPLORER_API_KEY ?? '',
  privyKeyExportUrl: process.env.EXPO_PUBLIC_PRIVY_KEY_EXPORT_URL ?? '',
  solanaDevnetRpcUrl: process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC_URL ?? '',
  solanaRpcUrl: process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? '',
};

export const isDemoMode = !env.privyAppId || !env.privyMobileClientId;
