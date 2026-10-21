import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyALHIFsULKrYANKgGW-mv6oL7gt-onzk-Y",
  authDomain: "learning-management-syst-21723.firebaseapp.com",
  projectId: "learning-management-syst-21723",
  storageBucket: "learning-management-syst-21723.firebasestorage.app",
  messagingSenderId: "580757340398",
  appId: "1:580757340398:web:fad62cf7f44f047111f3ff",
  measurementId: "G-LC2VDPZ7NM",

  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}; 

// 1. Initialize the Master Firebase Connection
const app = initializeApp(firebaseConfig);

// 2. Initialize Individual Services using that connection
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);       // Initialized for user logins later
const storage = getStorage(app); // Initialized for biometric photo uploads later

// 3. EXPORT THEM so the rest of your app can use them!
export { app, db, auth, storage };