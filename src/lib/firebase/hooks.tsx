"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { type User, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./config";
import { ensureUserDoc } from "./auth";
import type { UserDoc, UserRole } from "@/lib/types/models";

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userDoc: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // Process the result from signInWithRedirect. This fires once per page load
  // immediately after the user returns from Google's OAuth page; returns null
  // on every other page load, so it's safe to call globally here.
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        const role =
          (sessionStorage.getItem("resigrid_pending_role") as UserRole | null) ??
          "tenant";
        sessionStorage.removeItem("resigrid_pending_role");
        await ensureUserDoc(
          result.user.uid,
          role,
          result.user.email ?? "",
          result.user.displayName ?? "",
          result.user.photoURL ?? undefined,
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      return;
    }
    const unsubDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setUserDoc(snap.exists() ? (snap.data() as UserDoc) : null);
    });
    return unsubDoc;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
