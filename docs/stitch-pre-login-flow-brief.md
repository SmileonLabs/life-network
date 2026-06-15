# LIFE NETWORK Pre-Login Flow Design Brief For Stitch

## Goal

Design the screens that come after the already-completed LIFE NETWORK pre-login entry screen.

The first screen already exists and should not be redesigned.

The existing first screen has:

- LIFE NETWORK logo
- Primary CTA: `Create New Wallet`
- Secondary CTA: `Connect Existing Wallet`

This brief is only for the screens triggered after those two CTA buttons.

## Product Context

LIFE NETWORK is a premium Web3 wallet app for BNB Smart Chain users.

The app should feel:

- Native mobile
- Premium
- Secure
- Minimal
- Futuristic
- Deep, dark, and polished

Use a black/deep navy dark theme with refined Web3 glassmorphism.

## Visual Style

Maintain the same visual language as the first screen:

- Deep black and dark navy base
- LIFE lime as the primary accent
- Subtle cyan only for secondary information or security hints
- Metallic/chrome white text treatment where appropriate
- Refined glass panels
- Soft translucent borders
- Restrained glow
- Compact, tactile native-app controls

Avoid:

- Landing page layouts
- Dashboard/card-heavy composition
- Phone mockup frames
- Fake status bars
- Marketing copy
- Oversized accessibility-style buttons
- Generic crypto template styling

## Flow Overview

Design the following post-entry onboarding flow:

1. `Create New Wallet` bottom sheet
2. Google account continuation screen or bottom sheet state
3. New wallet password setup
4. New wallet completion
5. `Connect Existing Wallet` mnemonic import
6. Imported wallet password setup
7. Imported wallet completion

The flow is UI-only. Do not implement real OAuth, real wallet creation, real mnemonic validation, real encryption, or real transaction logic.

## Flow A: Create New Wallet

### A1. Create Wallet Bottom Sheet

Triggered when the user taps `Create New Wallet` on the first screen.

The first screen should remain dimmed in the background, and a premium bottom sheet should slide up from the bottom.

Required content:

- Title: `Create New Wallet`
- Primary CTA: `Continue with Google`
- Secondary small action: `Cancel`
- Helper text: `A wallet protection password will be set next.`

Visual direction:

- Native bottom sheet
- Rounded top corners
- Dark translucent glass surface
- Subtle top handle
- LIFE lime primary CTA
- Minimal copy

Avoid:

- Long explanations
- Multiple social login options
- WalletConnect / MetaMask / Trust Wallet options
- Biometric UI

### A2. Google Continuation State

After tapping `Continue with Google`, show a short transition or confirmation state.

Possible title:

- `Creating your wallet`

Possible supporting copy:

- `Preparing your embedded BSC wallet.`

Visual direction:

- Minimal loading state
- Premium native-app feel
- LIFE lime progress indicator or subtle animated ring
- No fake browser OAuth page

This can also be skipped if the design moves directly to password setup.

### A3. New Wallet Password Setup

After Google continuation, the user must set a wallet protection password.

Required content:

- Title: `Set Wallet Password`
- Supporting copy: `Use this password to unlock LIFE NETWORK on this device.`
- Field: `Password`
- Field: `Confirm Password`
- Requirement rows:
  - `At least 8 characters`
  - `Includes letters and numbers`
  - `Passwords match`
- Primary CTA: `Set Password`

Visual direction:

- Native form screen
- Compact input fields
- Dark glass input surfaces
- Requirements should feel like security checks, not a tutorial
- Keep layout minimal and focused

Security note:

- Do not imply this is an on-chain wallet password.
- This is an app unlock and wallet protection password.

### A4. New Wallet Complete

Shown after password setup.

Required content:

- Title: `Wallet Ready`
- Supporting copy: `Your LIFE NETWORK wallet has been created.`
- Primary CTA: `Enter Wallet`

Visual direction:

- Confident, minimal success state
- LIFE lime success accent
- No confetti
- No marketing copy

## Flow B: Connect Existing Wallet

### B1. Mnemonic Import

Triggered when the user taps `Connect Existing Wallet` on the first screen.

Required content:

- Title: `Connect Existing Wallet`
- Supporting copy: `Import your BSC wallet with a recovery phrase.`
- Text area placeholder: `Enter 12 or 24 recovery words`
- Word counter: `0/12 or 24`
- Security warning: `Never share your recovery phrase with anyone.`
- Primary CTA: `Continue`

Visual direction:

- Native wallet import screen
- Dark glass input area
- Clear security warning
- Compact and serious
- Not scary, but clearly protective

Avoid:

- External wallet options
- Wallet logos
- QR scan
- Private key import for this version
- Long educational copy

### B2. Imported Wallet Password Setup

After entering the recovery phrase, the user must set a local wallet protection password.

Required content:

- Title: `Protect Imported Wallet`
- Supporting copy: `Set a password to unlock this wallet on LIFE NETWORK.`
- Field: `Password`
- Field: `Confirm Password`
- Requirement rows:
  - `At least 8 characters`
  - `Includes letters and numbers`
  - `Passwords match`
- Primary CTA: `Finish Import`

Visual direction:

- Reuse the password setup layout from Flow A
- Keep wording specific to imported wallet protection
- Same native dark glass style

### B3. Imported Wallet Complete

Shown after imported wallet password setup.

Required content:

- Title: `Wallet Connected`
- Supporting copy: `Your existing wallet is ready on LIFE NETWORK.`
- Primary CTA: `Enter Wallet`

Visual direction:

- Minimal success state
- LIFE lime success accent
- No confetti
- No extra explanation

## Navigation Rules

Every screen after the first entry screen should include:

- Back navigation where appropriate
- Clear primary action
- No more than one primary CTA per screen
- Optional secondary cancel/back action only when needed

Bottom sheet behavior:

- `Cancel` closes the bottom sheet and returns to the first screen
- Tapping outside the bottom sheet may close it

## Copy Rules

Use English UI copy for this Stitch pass.

Use these CTA labels exactly:

- `Continue with Google`
- `Set Password`
- `Enter Wallet`
- `Continue`
- `Finish Import`

Use these titles exactly unless the design needs a minor adjustment:

- `Create New Wallet`
- `Set Wallet Password`
- `Wallet Ready`
- `Connect Existing Wallet`
- `Protect Imported Wallet`
- `Wallet Connected`

## Do Not Include

Do not include:

- Redesign of the first pre-login screen
- Marketing sections
- Feature lists
- Dashboard preview
- External wallet options
- MetaMask
- Trust Wallet
- WalletConnect
- Fingerprint or biometric UI
- Seed phrase reveal screen
- Real OAuth browser page
- Transaction screens
- Swap or buy flows

## Stitch Prompt

Design the post-entry onboarding flow for a premium Web3 wallet app called LIFE NETWORK.

The first pre-login screen already exists and should not be redesigned. It has a LIFE NETWORK logo and two buttons: `Create New Wallet` and `Connect Existing Wallet`.

Design only the screens that appear after those buttons are tapped.

Use a native mobile app feel with a deep black and dark navy theme, refined glassmorphism, LIFE lime accents, subtle cyan only when needed, compact controls, and premium Web3 financial styling. Avoid landing page layouts, phone mockups, dashboard cards, marketing copy, external wallet logos, and oversized accessibility-style UI.

Flow A: When the user taps `Create New Wallet`, show a dark glass bottom sheet over the existing first screen. The bottom sheet should have the title `Create New Wallet`, a primary button `Continue with Google`, a small `Cancel` action, and the helper text `A wallet protection password will be set next.` After continuing, design a password setup screen with the title `Set Wallet Password`, fields `Password` and `Confirm Password`, requirement rows `At least 8 characters`, `Includes letters and numbers`, and `Passwords match`, plus the primary CTA `Set Password`. Then design a success screen with the title `Wallet Ready`, supporting copy `Your LIFE NETWORK wallet has been created.`, and CTA `Enter Wallet`.

Flow B: When the user taps `Connect Existing Wallet`, design a mnemonic import screen with the title `Connect Existing Wallet`, supporting copy `Import your BSC wallet with a recovery phrase.`, a text area placeholder `Enter 12 or 24 recovery words`, a word counter `0/12 or 24`, the warning `Never share your recovery phrase with anyone.`, and CTA `Continue`. Then design an imported wallet password setup screen with the title `Protect Imported Wallet`, fields `Password` and `Confirm Password`, requirement rows `At least 8 characters`, `Includes letters and numbers`, and `Passwords match`, plus CTA `Finish Import`. Then design a success screen with the title `Wallet Connected`, supporting copy `Your existing wallet is ready on LIFE NETWORK.`, and CTA `Enter Wallet`.

Keep every screen minimal, secure, native, dark, glassy, and premium. Do not add feature descriptions, tutorials, external wallet options, biometric UI, transaction flows, or marketing sections.
