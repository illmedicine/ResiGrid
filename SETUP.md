# ResiGrid — Setup

## Prerequisites

- Node.js 20+ and npm
- A Firebase project (Blaze plan required — Cloud Functions calling external APIs like Square need outbound network access)
- A Square Developer account/application
- The `firebase-tools` CLI: `npm install -g firebase-tools`, then `firebase login`

## 1. Local development

```bash
npm install
cp .env.local.example .env.local   # fill in real values, see below
npm run dev
```

`.env.local` is gitignored — never commit it. The Firebase web config (`NEXT_PUBLIC_FIREBASE_*`) and Square `NEXT_PUBLIC_SQUARE_APPLICATION_ID`/`NEXT_PUBLIC_SQUARE_LOCATION_ID` are not secret (they're safe in a browser bundle); Square's access token and OAuth app secret are secret and only ever go in `functions/.env.local` (also gitignored) or Firebase secrets — never in the Next.js app's env.

## 2. Firebase project

In the [Firebase Console](https://console.firebase.google.com/):

1. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
2. **Firestore Database** → create database (production mode).
3. **Storage** → create default bucket.
4. Project Settings → General → add a Web App if you haven't, copy the config into `.env.local`.

Deploy rules, indexes, and functions from the repo root:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
cd functions && npm install && cd ..
firebase deploy --only functions
```

Functions read Square credentials from environment config. For local emulator testing, `functions/.env.local` is loaded automatically. For deployed functions, set secrets instead:

```bash
firebase functions:secrets:set SQUARE_ACCESS_TOKEN
firebase functions:secrets:set SQUARE_APPLICATION_SECRET
```

and set the non-secret function config values (`SQUARE_LOCATION_ID`, `SQUARE_APPLICATION_ID`, `SQUARE_OAUTH_REDIRECT_URI`, `SQUARE_ENV`, `CLAIM_BASE_URL`) either as additional secrets or via `firebase functions:config` / `.env` files per your deployed runtime — see the [Firebase Functions params docs](https://firebase.google.com/docs/functions/config-env) for the current recommended approach at deploy time.

To test locally without touching production data:

```bash
firebase emulators:start
```

## 3. Square

In the [Square Developer Dashboard](https://developer.squareup.com/apps):

1. Use your existing application (Application ID / Location ID already wired into `.env.local`).
2. **OAuth** page → add redirect URI: `https://resigrid.co/pm/payouts/callback` → copy the **Application Secret** into `functions/.env.local` as `SQUARE_APPLICATION_SECRET` (or a Firebase secret when deployed).
3. Confirm the account is approved for live (production) payments processing before going live — this app is configured for production, not sandbox, per project decision.

### How payments actually move (read this before relying on it)

- **Tenant → ResiGrid**: real, via Square's Payments API (Web Payments SDK card tokenization + `paymentsApi.createPayment`).
- **ResiGrid → a property manager who has connected their own Square account**: real — the charge is created directly against the connected account (via Square OAuth/Connect) with `locationId` set to theirs, so Square pays them out on its own normal schedule.
- **ResiGrid → a landlord who isn't on ResiGrid yet**: the card is securely tokenized and saved (Square Customer + Card-on-file) under ResiGrid's own Square account — **no charge happens yet**. When that landlord later claims the voucher, they're required to sign up and connect a Square account (creating one if needed); only then is the saved card actually charged, directly into their newly connected account. This is a deliberate design constraint: **Square's public API has no "send to any bank account" disbursement endpoint** (confirmed by inspecting the `BankAccountsApi`/`PayoutsApi` — both are read-only). The "claim a payment without ever needing your own account" promise from the original product idea is therefore not literally true on Square — claiming requires creating a (free) Square account. If a true no-account-needed experience is required later, that needs a second money-movement rail (e.g. Stripe Treasury, Dwolla) layered on top of Square, which is out of scope for this pass.

## 4. GitHub Pages + GoDaddy domain (resigrid.co)

Already configured in this repo:
- `public/CNAME` contains `resigrid.co`
- `.github/workflows/deploy.yml` builds the static export and deploys it to GitHub Pages on every push to `main`

One-time GitHub repo setup:
1. **Settings → Pages** → set custom domain to `resigrid.co`, enable **Enforce HTTPS** once it verifies.
2. **Settings → Secrets and variables → Actions** → add these repository secrets (the workflow reads them at build time):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
   - `NEXT_PUBLIC_SQUARE_LOCATION_ID`

GoDaddy DNS (already done for `resigrid.co`):
- 4 `A` records on `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `CNAME` on `www` → `<github-username>.github.io.`

If you ever temporarily host on a GitHub Pages project path instead of the custom domain (e.g. `https://<user>.github.io/ResiGrid/`), set `NEXT_PUBLIC_BASE_PATH=/ResiGrid` in the workflow/`.env.local` and remove `public/CNAME`.

## 5. Known gaps / next steps

- **Notification delivery** (email/SMS/push for new messages, maintenance updates, voucher claims) is stubbed as `logger.info(...)` in Cloud Functions — wire up a provider (e.g. SendGrid, Twilio, FCM) when ready.
- **Lease e-signature** is a simple status flag (`unsigned` / `tenant_signed` / `fully_signed`), not a real e-signature provider (e.g. DocuSign, HelloSign).
- **Storage rules** for maintenance request photos currently allow any signed-in user to read/write that path — tighten once the photo-upload UI is built, scoping to the request's tenant and the owning property manager.
- **Messaging encryption** is Firestore's standard encryption at rest/in transit (Google-managed), not end-to-end encryption.
- The voucher payout design above (Square Connect / OAuth) is the realistic near-term approach; revisit if a true "claim without creating any account" experience becomes a hard requirement.
