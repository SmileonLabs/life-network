# Kraken Wallet React Native Analysis

Source: https://github.com/krakenfx/wallet  
Local reference: `references/kraken-wallet`  
Checked commit: `f37acfe`  
License: MIT, copyright notice must be preserved if substantial code is reused.

## Why This Repo Matters

Kraken Wallet is more useful to LIFE Wallet than the Android Compose wallet because it is already a React Native app. We should not copy its visual identity, brand assets, or full multi-chain complexity, but we can learn from its app architecture, screen flow, native wallet UX patterns, and component boundaries.

The strongest takeaway: Kraken Wallet feels like a real mobile wallet because it relies on dense native screens, bottom sheets, typed navigation stacks, row-based lists, floating action areas, and small reusable primitives instead of big dashboard cards.

## Tech Stack

- React Native `0.79`
- React `19`
- Expo modules, but not Expo Router
- React Navigation native stack
- `@gorhom/bottom-sheet`
- `react-native-reanimated`
- `react-native-safe-area-context`
- `@shopify/flash-list`
- Realm for local wallet/token/transaction state
- React Query for remote API state
- Keychain/secure store patterns for sensitive wallet access
- Native modules for gradient, cloud backup, sensitive clipboard, WalletConnect

## App Architecture Pattern

Kraken uses a single root native stack in `src/Navigation.tsx`, with feature-specific routers for deeper flows:

- `OnboardingRouter`
- `SendRouter`
- `SettingsRouter`
- `AccountRouter`
- `KrakenConnectSendRouter`

This is worth copying conceptually. For LIFE Wallet, even if we keep Expo Router, we should still organize features as mini-flows:

- `features/onboarding`
- `features/wallet`
- `features/assets`
- `features/send`
- `features/receive`
- `features/activity`
- `features/security`

Each feature should own its screen components, hooks, validation helpers, and UI-only flow state.

## Core Screens Found

Kraken Wallet contains these screen groups:

- Onboarding
  - Intro
  - Create wallet
  - Import wallet
  - Backup prompt
  - Backup verify
  - Secure wallet
  - Push prompt
  - Outro

- Home
  - Total balance
  - Send / Receive / Swap / Earn actions
  - Recent activity
  - Asset panel
  - Account switcher

- Assets and token details
  - Asset rows
  - Token transaction screen
  - Token market data bottom sheet
  - Manage assets

- Send
  - Send input
  - QR scan
  - Fee selector
  - Risk warning
  - Confirm sheet
  - Broadcast result

- Receive
  - Full-height bottom sheet
  - QR code
  - Address display
  - Share action
  - Network warning

- Activity
  - Global activity
  - Token-specific activity
  - Date grouping
  - Pending transactions
  - Transaction details

- Settings
  - Wallet management
  - Backup
  - App lock
  - Password protection
  - Connected apps
  - Privacy
  - Advanced settings
  - Support/about

- dApp / WalletConnect
  - Connect app
  - QR scan
  - Connected apps
  - Sign request screens
  - Transaction signing screens

## UI System Worth Porting Conceptually

These components are the most relevant:

- `GradientScreenView`
  - Full-screen dark background layer.
  - LIFE version should be subtler and not overly purple.

- `LargeHeader`
  - Strong screen title / balance headline.
  - LIFE should use it sparingly for Home, not every screen.

- `FloatingBottomButtons`
  - Native-feeling fixed bottom CTA area.
  - Perfect for onboarding, send review, password setup.

- `BottomSheet`
  - Premium modal layer for receive, Google sign-in, review, warnings.
  - LIFE needs this early.

- `Button`
  - Size variants, icon support, loading state, disabled opacity.
  - LIFE should make buttons smaller and less pill-heavy than Kraken.

- `Label`
  - Centralized typography names.
  - LIFE needs a similar `Text` primitive to avoid random font sizes.

- `Input`
  - Footer text, error state, focus background, right/left slots.
  - Useful for mnemonic, password, address, amount.

- `AssetRow`
  - Icon, asset name, network/tag, fiat value, token amount.
  - This should become our `AssetListRow`.

- `TransactionRow`
  - Left icon/title/subtitle and right amount/status.
  - This should become our `ActivityListRow`.

- `SettingsItem`
  - Sectioned settings list row with icon, badge, chevron.
  - This should become our `SettingsRow` / `WalletRow`.

## Design Lessons For LIFE Wallet

Do:

- Use native app rhythm: header, content list, fixed bottom CTA.
- Keep list rows dense: 52-64px height is enough.
- Use bottom sheets for decisions and confirmation.
- Keep transaction review as a sheet, not a full dashboard panel.
- Keep settings/profile as grouped rows, not cards.
- Keep Home focused: balance, two or four actions, recent activity, assets.
- Use one accent color for primary action and reserve warning colors for security.

Avoid:

- Copying Kraken's purple-heavy visual identity.
- Copying Kraken logos, icons, Lottie assets, gradients, or exchange-specific features.
- Bringing over NFTs, Earn, Swap, WalletConnect, cloud backup, push prompts, or multi-chain complexity for v1.
- Building a huge dashboard web layout. This should remain a mobile wallet UI that expands gracefully on web.

## BSC Relevance

Kraken does not include BNB Smart Chain in its supported EVM network list. However, the repo has a generic `EVMNetwork` model used for Ethereum, Polygon, Arbitrum, Base, Optimism, Linea, Avalanche C-Chain, and others.

For LIFE Wallet, the useful idea is:

- Define BSC as the primary network object.
- Treat BNB as the native gas asset.
- Treat LIFE as the pinned BEP-20 asset.
- Reuse the same send/receive/activity UI for both native BNB and BEP-20 transfers.
- Avoid Kraken's multi-chain selection complexity until we actually need it.

## LIFE Wallet Screen List After Kraken Review

Immediate screens:

1. `Welcome`
   - LIFE NETWORK logo
   - `Create New Wallet`
   - `Connect Existing Wallet`

2. `CreateWallet`
   - Google sign-in bottom sheet
   - Wallet creation pending/success state
   - Password setup

3. `ImportWallet`
   - Mnemonic input
   - Password setup
   - Import success state

4. `Unlock`
   - Password input on app return
   - No biometrics for now

5. `Home`
   - Total value
   - LIFE balance
   - BNB gas balance
   - Send / Receive
   - Recent activity

6. `Assets`
   - LIFE pinned row
   - BNB row
   - Discovered BEP-20 rows
   - Search/filter

7. `AssetDetail`
   - Token balance
   - Send / Receive
   - Token-specific activity

8. `Send`
   - Asset selector
   - Recipient
   - Amount
   - Gas estimate
   - Review bottom sheet
   - Success/failure state

9. `Receive`
   - QR
   - BSC-only warning
   - Address display
   - Copy/share

10. `Activity`
   - Date-grouped activity
   - Pending/success/failed states
   - Explorer link

11. `Profile`
   - Active wallet
   - Wallet switch
   - Import wallet
   - Security
   - Logout

12. `Security`
   - Change password
   - Backup/recovery guidance
   - Sensitive info policy
   - Future approvals/connected dApps section

Later screens:

- WalletConnect
- Connected dApps
- Token approvals
- Recovery phrase backup flow
- Push notifications
- Multi-network settings

## Proposed LIFE UI Component Set

```text
src/shared/ui/
  app-screen.tsx
  large-balance-header.tsx
  floating-bottom-actions.tsx
  bottom-sheet.tsx
  app-button.tsx
  app-text.tsx
  app-input.tsx
  asset-list-row.tsx
  activity-list-row.tsx
  settings-section.tsx
  settings-row.tsx
  wallet-row.tsx
  token-icon.tsx
  status-badge.tsx
  warning-block.tsx
```

Feature ownership:

```text
src/features/onboarding/
  screens/
  components/
  hooks/
  types.ts

src/features/wallet/
src/features/assets/
src/features/send/
src/features/receive/
src/features/activity/
src/features/security/
```

## Recommended Build Order

1. Build shared theme tokens and text/button/input primitives.
2. Build `AppScreen`, `FloatingBottomActions`, and `BottomSheet`.
3. Rebuild pre-login screens from blank state.
4. Build Home with real wallet-app hierarchy.
5. Build Assets and Activity as dense lists.
6. Build Send and Receive flows.
7. Build Profile/Security settings rows.

This order gives us the fastest path from blank app to a native-feeling wallet demo without dragging in features we do not need yet.
