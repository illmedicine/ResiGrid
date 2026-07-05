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
// back to login without completing sign-in. authDomain is set to resigrid.co
// so the popup handler runs on the same origin and avoids COOP isolation
// (accounts.google.com sets COOP: same-origin mid-flow, which would break
// cross-origin popup references if we used the default firebaseapp.com domain).
export async function signInWithGoogle(role: UserRole): Promise<void> {
  sessionStorage.setItem("resigrid_pending_role", role);
  const provider = new GoogleAuthProvider();
  // Don't clear sessionStorage in a catch — if signInWithPopup rejects due
  // to a transient error but Firebase auth state was set, AuthProvider's
  // onSnapshot still needs the role to create the user doc correctly.
  await signInWithPopup(auth, provider);
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
