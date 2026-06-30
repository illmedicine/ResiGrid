"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
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
  const creatingRef = useRef(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) setUserDoc(null);
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      creatingRef.current = false;
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsub = onSnapshot(
      userRef,
      async (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data() as UserDoc);
          creatingRef.current = false;
          return;
        }

        // Doc doesn't exist yet — create it. Prevent concurrent attempts.
        if (creatingRef.current) return;
        creatingRef.current = true;

        // Role comes from sessionStorage (set before the Google redirect).
        const role =
          (sessionStorage.getItem("resigrid_pending_role") as UserRole | null) ??
          "tenant";
        sessionStorage.removeItem("resigrid_pending_role");

        try {
          await setDoc(userRef, {
            uid: user.uid,
            role,
            displayName: user.displayName ?? user.email ?? "",
            email: user.email ?? "",
            photoURL: user.photoURL ?? null,
            createdAt: Date.now(),
            serverCreatedAt: serverTimestamp(),
          });
          // onSnapshot fires again with the new doc and sets userDoc.
        } catch {
          // Write failed (likely a rules issue) — reset so it retries.
          creatingRef.current = false;
        }
      },
      () => {
        // Snapshot listener error — clear doc so UI can show an error state.
        setUserDoc(null);
        creatingRef.current = false;
      },
    );

    return () => {
      unsub();
      creatingRef.current = false;
    };
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
