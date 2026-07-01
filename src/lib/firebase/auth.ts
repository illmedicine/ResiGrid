import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "./config";
import type { UserRole } from "@/lib/types/models";

// signInWithPopup is used instead of signInWithRedirect because Chrome's
// Bounce Tracking Mitigations (Privacy Sandbox) clear Firebase's stored auth
// state when it detects the resigrid.co → firebaseapp.com → google.com →
// resigrid.co redirect chain as bounce tracking — causing the page to loop
// back to login without completing sign-in. signInWithPopup avoids any
// page navigation; Firebase v10 falls back to BroadcastChannel when
// COOP headers are present, so the popup works correctly on GitHub Pages.
export async function signInWithGoogle(role: UserRole): Promise<void> {
  sessionStorage.setItem("resigrid_pending_role", role);
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged fires on the main page → AuthProvider's onSnapshot
    // handler creates the user doc → AuthGate's useEffect redirects to portal.
  } catch (err) {
    // Clear pending role so a retry doesn't use stale data.
    sessionStorage.removeItem("resigrid_pending_role");
    throw err;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  displayName: string,
) {
  sessionStorage.setItem("resigrid_pending_role", role);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  sessionStorage.setItem("resigrid_pending_role", role);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function ensureUserDoc() {
  // User doc creation is handled entirely in AuthProvider's onSnapshot.
  // This stub is kept for any legacy callers.
}

export async function signOut() {
  await firebaseSignOut(auth);
}
