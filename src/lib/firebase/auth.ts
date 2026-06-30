import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
import type { UserDoc, UserRole } from "@/lib/types/models";

// Exported so AuthProvider can call it after the redirect result resolves.
export async function ensureUserDoc(
  uid: string,
  role: UserRole,
  email: string,
  displayName: string,
  photoURL?: string,
) {
  const ref = doc(db, "users", uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  const data: Partial<UserDoc> & Record<string, unknown> = {
    uid,
    role,
    displayName: displayName || email,
    email,
    createdAt: Date.now(),
    serverCreatedAt: serverTimestamp(),
  };
  if (photoURL) data.photoURL = photoURL;

  await setDoc(ref, data);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  displayName: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(cred.user.uid, role, email, displayName);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// GitHub Pages (and many static hosts) set Cross-Origin-Opener-Policy:
// same-origin which breaks signInWithPopup's window.closed polling.
// signInWithRedirect navigates the current tab to Google and back, avoiding
// the COOP restriction entirely. The role is stored in sessionStorage so it
// survives the cross-origin redirect and can be read in AuthProvider when
// the result resolves.
export function signInWithGoogle(role: UserRole): void {
  sessionStorage.setItem("resigrid_pending_role", role);
  const provider = new GoogleAuthProvider();
  void signInWithRedirect(auth, provider);
}

export async function signOut() {
  await firebaseSignOut(auth);
}
