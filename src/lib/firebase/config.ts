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
  // REVERTED to the default *.firebaseapp.com — switching this to resigrid.co
  // (to avoid Chrome's Bounce Tracking Mitigations breaking the sign-in
  // popup, see git history) requires first adding
  // https://resigrid.co/__/auth/handler to the "Authorized redirect URIs" of
  // the OAuth 2.0 client in Google Cloud Console (APIs & Services →
  // Credentials → the auto-created "Web client for Firebase"). Without that,
  // Google rejects every sign-in with "Error 400: redirect_uri_mismatch" for
  // ALL users, not just Incognito. Do that step first, verify it in the
  // Cloud Console, then re-apply authDomain: "resigrid.co" here.
  authDomain: "resigrid-96c9c.firebaseapp.com",
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
