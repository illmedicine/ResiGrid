import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
import type { UserDoc, UserRole } from "@/lib/types/models";

async function ensureUserDoc(
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

export async function signInWithGoogle(role: UserRole) {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDoc(
    cred.user.uid,
    role,
    cred.user.email ?? "",
    cred.user.displayName ?? "",
    cred.user.photoURL ?? undefined,
  );
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}
