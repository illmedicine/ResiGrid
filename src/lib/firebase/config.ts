import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";
import { type Functions, getFunctions } from "firebase/functions";

// Firebase web config is a public browser identifier — safe to commit.
// The sensitive pieces (Admin SDK private key, Square access token) live
// only in functions/.env.local and Firebase secrets, never here.
const firebaseConfig = {
  apiKey: "AIzaSyDOXEzMBE1uGRgIBFs4u0rJU95WOgMW95I",
  // Must match the app's own domain, not the default *.firebaseapp.com —
  // otherwise the Google sign-in popup bounces through firebaseapp.com and
  // accounts.google.com before returning to resigrid.co, and Chrome's Bounce
  // Tracking Mitigations (far more aggressive in Incognito/private browsing,
  // where third-party storage is blocked by default) can clear Firebase's
  // popup auth state mid-flow, silently leaving the user half signed-in:
  // request.auth is null for Firestore writes, and any UI gated on the
  // tenant/PM's auth state stops responding. Firebase Hosting automatically
  // serves the /__/auth/* handler on any connected custom domain, so this
  // just works since resigrid.co is already a Firebase Hosting domain.
  authDomain: "resigrid.co",
  projectId: "resigrid-96c9c",
  storageBucket: "resigrid-96c9c.firebasestorage.app",
  messagingSenderId: "518982670558",
  appId: "1:518982670558:web:2e250d6f99e1642123ca4f",
  measurementId: "G-Q63XPNYFTW",
};

// CoinDrop project — used as the Storage bucket for ResiGrid.
// ResiGrid's own Storage was blocked by GCP billing propagation.
// CoinDrop does not use Storage, so this has zero impact on that app.
const coinDropConfig = {
  apiKey: "AIzaSyCiDPW1rGWSbL1ozIFIVh3B_IaA8nReeI8",
  authDomain: "coindrop-e39de.firebaseapp.com",
  projectId: "coindrop-e39de",
  storageBucket: "coindrop-e39de.firebasestorage.app",
  messagingSenderId: "908591498193",
  appId: "1:908591498193:web:ae4b67e9d13d41e49f16f0",
};

export const firebaseApp: FirebaseApp =
  getApps()[0] ?? initializeApp(firebaseConfig);

const coinDropApp: FirebaseApp =
  getApps().find((a) => a.name === "coindrop") ??
  initializeApp(coinDropConfig, "coindrop");

// Explicit persistence fallback chain — some private/incognito modes (e.g.
// Safari Private Browsing) block or heavily restrict IndexedDB, which is
// Auth's default persistence. Without a fallback, auth state silently fails
// to persist there instead of degrading gracefully. initializeAuth() can
// only run once per app instance, so fall back to the already-initialized
// getAuth() on repeat module evaluation (Next.js Fast Refresh in dev).
// popupRedirectResolver must be passed explicitly here — unlike getAuth(),
// initializeAuth() does not wire it up automatically, and omitting it makes
// every signInWithPopup() call throw auth/argument-error.
export const auth: Auth = (() => {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(firebaseApp);
  }
})();
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(coinDropApp);
export const functions: Functions = getFunctions(firebaseApp);
