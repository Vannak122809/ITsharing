import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Firebase configuration — values loaded from .env (never hardcoded)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyC8Q_HiOb9uxLUO5kB9SrWO_KELS4DOjuw",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "login-form-49609.firebaseapp.com",
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || "https://login-form-49609-default-rtdb.firebaseio.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "login-form-49609",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "login-form-49609.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "292664137751",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:292664137751:web:45649890913bfa8433a452"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

