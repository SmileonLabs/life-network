# Unstoppable Wallet Android Analysis For LIFE NETWORK

## Source

- Repository: `https://github.com/horizontalsystems/unstoppable-wallet-android`
- Local analysis clone: `references/unstoppable-wallet-android`
- App type: native Android wallet, Kotlin, Jetpack Compose
- License: MIT

## Why This Repo Matters

Unstoppable Wallet is a mature non-custodial wallet. It is useful as a product map, not as a UI template.

The most useful parts for LIFE NETWORK are:

- account and wallet lifecycle
- PIN/app lock model
- create wallet / restore wallet separation
- balance and token portfolio structure
- send / receive / transaction history flows
- WalletConnect and dApp request handling
- security settings, address checking, approvals, privacy controls

The parts we should not copy for v1:

- broad multi-chain scope
- market analytics
- swap marketplace
- paid subscription model
- Tor/privacy stack
- advanced Bitcoin/Zcash/Monero/Solana/TON logic
- dashboard-like market pages

## High-Level Architecture Observations

### Project Modules

The repo is split into:

- `app`: main Android app
- `core`: wallet infrastructure, managers, adapters, storage
- `dapp-core`: dApp event and connection primitives
- `dapp-wallet-connect`: WalletConnect integration
- `subscriptions-*`: paid feature variants by distribution channel
- `components`: shared icons and chart views

### App Structure

Important directories:

- `core/managers`: account, wallet, adapter, price, security, transaction, WalletConnect, Tor, spam/risk managers
- `core/adapters`: blockchain adapter layer
- `modules`: feature screens and business flows
- `modules/main`: main tab shell, route handling, wallet switch
- `modules/balance`: wallet dashboard and token balances
- `modules/send`: chain-specific send flows
- `modules/receive`: receive address and QR flow
- `modules/transactions`: transaction list, filters, transaction detail
- `modules/createaccount`: new wallet creation
- `modules/restoreaccount`: wallet import and restore
- `modules/pin`: app lock, PIN setup, unlock, lockout
- `modules/manageaccount`: seed/private key/public key/account management
- `modules/walletconnect`: dApp connections and signing requests
- `modules/settings`: security, privacy, appearance, language, about, FAQ

### Pattern To Borrow

Unstoppable separates UI state and business logic cleanly:

- Managers own app-wide services: accounts, wallets, adapters, security, transactions.
- Feature services own domain state and validation.
- ViewModels combine service state into screen UI state.
- Screens stay focused on rendering and user events.

For our React Native app, the equivalent should be:

- `features/wallet/services`: wallet lifecycle, active wallet, generated/imported wallets
- `features/security/services`: app password, encrypted secret handling, lock state
- `features/tokens/services`: BNB/LIFE/BEP-20 balance and discovery
- `features/transfer/services`: recipient, amount, gas, review, send result
- `features/activity/services`: transaction history, filters, explorer links
- `features/dapp/services`: later WalletConnect and signing requests

## Product Flow In Unstoppable

### Cold Start

`MainActivity` validates:

- system lock / keystore state
- whether accounts exist
- whether the user should see intro / onboarding
- whether PIN lock should overlay the app
- whether WalletConnect or TonConnect requests need handling

LIFE NETWORK equivalent:

- if no session/wallet: show pre-login
- if wallet exists but locked: show password unlock
- if wallet exists and unlocked: show app shell
- if deep link / dApp request exists: route to request review later

### Main App Tabs

Unstoppable main tabs are:

- Market
- Balance
- Swap
- Settings

Transactions tab exists in code but is commented out from the main nav.

LIFE NETWORK should not copy this tab structure directly. Our likely v1 tabs:

- Home
- Assets
- Send
- Activity
- Me

Receive can be an action from Home/Assets rather than a permanent tab.

## Feature Inventory From Unstoppable

## 1. Account And Wallet Lifecycle

Relevant modules:

- `createaccount`
- `restoreaccount`
- `manageaccount`
- `manageaccounts`
- `managewallets`
- `core/managers/AccountManager.kt`
- `core/managers/WalletManager.kt`
- `core/managers/WalletActivator.kt`

Key ideas:

- Account is the identity/secret container.
- Wallet is an enabled token/blockchain under an account.
- Active account drives every balance/send/receive screen.
- Created and restored accounts are treated differently.
- Backup status matters.

LIFE NETWORK needs:

- generated embedded wallet account
- imported wallet account
- active wallet selector
- wallet naming
- wallet delete / disconnect
- backup / recovery state
- no raw secret stored in logs, cache, or plain storage

## 2. Security And Unlock

Relevant modules:

- `pin`
- `keystore`
- `settings/security`
- `backuplocal`
- `manageaccount/recoveryphrase`
- `manageaccount/evmprivatekey`

Key ideas:

- App lock is separate from wallet seed.
- Unlock screen overlays the main app.
- Lockout state protects against repeated attempts.
- Backup/recovery phrase reveal is gated.
- Security settings are a full product surface, not a checkbox.

LIFE NETWORK v1 needs:

- password setup after wallet create/import
- password unlock screen on app return
- local encrypted storage plan
- seed/private key reveal protection
- import warning and confirmation
- wallet removal confirmation

Later:

- biometric unlock
- auto-lock timer
- duress PIN
- local encrypted backup

## 3. Balance / Home

Relevant modules:

- `balance`
- `balance/token`
- `core/managers/AdapterManager.kt`
- `core/managers/PriceManager.kt`
- `core/managers/BalanceHiddenManager.kt`

Key ideas:

- Total balance is separate from token rows.
- Balance can be hidden.
- Wallet rows can show loading/sync/error states.
- Sort and view mode exist but are not essential for v1.
- Token detail has balance and transactions.

LIFE NETWORK v1 needs:

- total portfolio value
- LIFE fixed hero asset
- BNB gas balance
- BEP-20 token list
- loading/error/sync states
- hide balance toggle
- token detail page

Avoid in v1:

- complex sorting
- multi-account aggregate views
- market-heavy token analytics

## 4. Send

Relevant modules:

- `send/evm`
- `sendevmtransaction`
- `evmfee`
- `amount`
- `enteraddress`
- `confirm`
- `eip20approve`
- `eip20revoke`

Key ideas:

- Send is split into address, amount, fee, confirmation.
- EVM send supports transaction data generation before signing.
- Address validation and amount validation are separate services.
- Fee settings are their own screen.
- Approval and revoke flows are distinct from normal send.

LIFE NETWORK v1 needs:

- select asset
- recipient address input
- amount input
- max button
- BNB gas check
- insufficient balance / invalid address validation
- review screen
- transaction result screen
- explorer link

v1.5 should add:

- address book / recent contacts
- QR scan
- advanced gas settings
- speed up / cancel pending transaction

Security later:

- approval review
- revoke approval
- address risk warning

## 5. Receive

Relevant modules:

- `receive`
- `receive/viewmodels/ReceiveAddressViewModel.kt`

Key ideas:

- Receive address is derived from active wallet/token.
- QR and URI can include amount.
- Network/address format warning matters.
- Used addresses matter for UTXO chains, but less for BSC.

LIFE NETWORK v1 needs:

- active wallet address
- QR code
- copy address
- share address
- BSC-only warning
- selected token/network label

No need in v1:

- address format picker
- used address history
- UTXO-specific receive variants

## 6. Activity / Transactions

Relevant modules:

- `transactions`
- `transactionInfo`
- `xtransaction`
- `core/managers/TransactionAdapterManager.kt`

Key ideas:

- Transaction list is grouped by date.
- Filters include token, type, blockchain, contact.
- Transaction detail is a separate screen.
- Sync/loading state matters.
- Suspicious transactions can be hidden.

LIFE NETWORK v1 needs:

- date-grouped transaction list
- status: pending / success / failed
- direction: sent / received / contract interaction
- amount and token symbol
- tx detail page
- explorer link
- basic filter by asset and type

v1.5:

- hide suspicious/spam transactions
- contact labels
- speed up/cancel pending EVM tx

## 7. WalletConnect / dApp

Relevant modules:

- `walletconnect`
- `dapp-core`
- `dapp-wallet-connect`
- `tonconnect`

Key ideas:

- dApp connection is not just “connect”.
- There are pairing/session screens.
- Signing requests need dedicated review screens.
- Transaction requests need risk/fee/review UI.
- Pending requests can badge settings/main nav.

LIFE NETWORK should not include this in v1 unless required.

v2 pages:

- connected dApps
- connection request
- sign message request
- send transaction request
- session detail
- disconnect session

## 8. Settings / Profile

Relevant modules:

- `settings/main`
- `settings/security`
- `settings/privacy`
- `settings/appearance`
- `settings/language`
- `settings/about`
- `manageaccount`
- `managewallets`

Key ideas:

- Settings are functional, not decorative.
- Security, privacy, account, wallet management are separated.
- App status/about/release notes/FAQ are included.

LIFE NETWORK v1 needs:

- account profile
- active wallet management
- imported/generated wallet list
- import wallet
- export/reveal recovery information, guarded
- app lock/password change
- logout
- support/about

v1.5:

- base currency
- theme
- language
- app status
- connected dApps
- approvals

## 9. Market / Swap

Relevant modules:

- `market`
- `coin`
- `multiswap`
- `swap`

Key ideas:

- Unstoppable has deep analytics and swap provider logic.
- This is a major product area, not a small feature.

LIFE NETWORK should defer this unless the business model requires it.

Possible future:

- LIFE token detail analytics
- simple swap entry
- buy BNB/LIFE
- reward/health-data economy pages

## Recommended LIFE NETWORK Page Map

## V0: Pre-Login And Wallet Bootstrap

These should be built first.

- `Welcome`
  - LIFE NETWORK logo
  - Create New Wallet
  - Connect Existing Wallet

- `CreateWalletGoogle`
  - Google account selection
  - embedded wallet creation placeholder

- `CreateWalletPassword`
  - set app/wallet protection password

- `ImportWalletMnemonic`
  - recovery phrase input
  - security warning

- `ImportWalletPassword`
  - password setup for imported wallet

- `Unlock`
  - password unlock when wallet exists

- `WalletReady`
  - completion state

## V1: Core Wallet

- `Home`
  - LIFE balance
  - BNB gas balance
  - total value
  - quick actions: Send, Receive
  - recent activity

- `Assets`
  - LIFE fixed asset
  - BNB
  - discovered BEP-20 tokens
  - token search/filter

- `TokenDetail`
  - balance
  - contract/network metadata
  - token transactions
  - send/receive actions

- `SendAssetSelect`
  - choose LIFE/BNB/BEP-20

- `SendRecipient`
  - address input
  - paste/scan later
  - validation

- `SendAmount`
  - amount input
  - fiat equivalent later
  - max

- `SendReview`
  - recipient
  - amount
  - estimated gas
  - BSC network check

- `SendResult`
  - pending/success/failure
  - explorer link

- `Receive`
  - address QR
  - copy/share
  - BSC-only warning

- `Activity`
  - date-grouped list
  - pending/success/failure
  - asset/type filters

- `TransactionDetail`
  - tx hash
  - status
  - gas
  - explorer link

- `Profile`
  - account info
  - active wallet
  - wallet list
  - import wallet
  - logout

- `Security`
  - password change
  - reveal seed/private key gated
  - secret handling warnings

## V1.5: Wallet Maturity

- `WalletSwitcher`
- `WalletDetail`
- `BackupRecovery`
- `AddressBook`
- `QRScanner`
- `GasSettings`
- `ApprovalList`
- `ApprovalDetail`
- `RevokeApproval`
- `SuspiciousTransactionWarning`
- `BaseCurrency`
- `Language`

## V2: dApp And Web3 Power User

- `ConnectedDApps`
- `WalletConnectPairing`
- `DAppConnectionRequest`
- `SignMessageRequest`
- `SendTransactionRequest`
- `SessionDetail`
- `Swap`
- `Buy`
- `MarketTokenDetail`
- `LIFERewards`
- `HealthDataConsent`

## Recommended Feature Directory Map For Our React Native App

```text
src/
  app/
    sign-in.tsx
    unlock.tsx
    index.tsx
    assets/
      index.tsx
      [address].tsx
    send/
      index.tsx
      review.tsx
      result.tsx
    receive.tsx
    activity/
      index.tsx
      [hash].tsx
    profile.tsx
    security.tsx

  features/
    auth/
      components/
      hooks/
      services/
      types.ts
    wallet/
      components/
      hooks/
      services/
      types.ts
    security/
      components/
      hooks/
      services/
      types.ts
    tokens/
      components/
      hooks/
      services/
      types.ts
    transfer/
      components/
      hooks/
      services/
      types.ts
    activity/
      components/
      hooks/
      services/
      types.ts
    dapp/
      components/
      hooks/
      services/
      types.ts

  shared/
    api/
    config/
    layout/
    theme/
    ui/
    utils/

  providers/
```

## Key Product Decisions Needed

Before rebuilding screens, decide:

1. Is v1 embedded-wallet only, or embedded plus mnemonic import?
2. Should private key import be included, or mnemonic only?
3. Is app password required before or after Google wallet creation?
4. Is LIFE token mainnet contract ready?
5. Are we using BSC mainnet, testnet, or both?
6. Which explorer API will power activity/token discovery?
7. Are WalletConnect and dApp approvals v1 or v2?
8. Do we need token price/fiat total in v1?
9. Should receive be a tab, or a quick action?
10. Should health-data/rewards pages be hidden until wallet v1 is stable?

## Suggested Immediate Next Step

Do not rebuild every wallet feature at once.

Start with this slice:

1. Pre-login flow
2. Password unlock shell
3. Home
4. Assets
5. Receive
6. Send review mock
7. Activity mock
8. Profile/security

Then wire real BSC data behind those screens.
