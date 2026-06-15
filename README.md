# LIFE Wallet

Expo 기반 React Native / Web dApp입니다. LIFE 토큰 중심의 BNB Smart Chain 지갑 UX를 검증하기 위한 v1 구현입니다.

## 구현 범위

- Google 로그인 demo flow와 embedded wallet 생성 UX
- LIFE, BNB, 자동 탐색된 BEP-20 토큰 대시보드
- BNB/BEP-20 송금 검증과 activity 기록
- 수신 QR, 토큰 상세, 지갑 가져오기, 지갑 전환
- Web desktop sidebar + mobile bottom tab responsive shell

현재 Privy 키와 import relay backend가 없으면 demo mode로 동작합니다. 실제 연동 시 아래 환경 변수를 연결하면 됩니다.

```bash
EXPO_PUBLIC_PRIVY_APP_ID=
EXPO_PUBLIC_PRIVY_CLIENT_ID=
EXPO_PUBLIC_LIFE_TOKEN_ADDRESS=
EXPO_PUBLIC_BSC_RPC_URL=
EXPO_PUBLIC_BSC_TESTNET_RPC_URL=
EXPO_PUBLIC_EXPLORER_API_KEY=
```

## 실행

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

또는 플랫폼별로 바로 실행할 수 있습니다.

```bash
npm run web
npm run android
npm run ios
```

개발은 `src/app`의 페이지와 `src/features`의 기능 단위 모듈을 중심으로 진행하면 됩니다.

## 구조

```text
src/app        Expo Router pages
src/features   auth, wallet, tokens, transfer, activity, security
src/shared     config, layout, theme, ui, utils
src/providers  app-level providers
```

## 검증

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

## 참고

- [Expo documentation](https://docs.expo.dev/)
- [Privy React Native setup](https://docs.privy.io/basics/react-native/setup)
- [BNB Chain wallet configuration](https://docs.bnbchain.org/bnb-opbnb/get-started/wallet-configuration/)
