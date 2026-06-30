import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";
import { type Functions, getFunctions } from "firebase/functions";

// Firebase web config is a public browser identifier — safe to commit.
// The sensitive pieces (Admin SDK private key, Square access token) live
// only in functions/.env.local and Firebase secrets, never here.
const firebaseConfig = {
  apiKey: "AIzaSyDOXEzMBE1uGRgIBFs4u0rJU95WOgMW95I",
  authDomain: "resigrid-96c9c.firebaseapp.com",
  projectId: "resigrid-96c9c",
  storageBucket: "resigrid-96c9c.firebasestorage.app",
  messagingSenderId: "518982670558",
  appId: "1:518982670558:web:2e250d6f99e1642123ca4f",
  measurementId: "G-Q63XPNYFTW",
};

export const firebaseApp: FirebaseApp =
  getApps()[0] ?? initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const functions: Functions = getFunctions(firebaseApp);
