// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

console.log('Firebase initialization starting...');

// Loading environment variables
const env = import.meta.env;
console.log('Environment mode:', env.MODE);
console.log('Loading Firebase config from environment variables');

// Properly load Firebase config from env variables with fallbacks
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Log config to verify (without showing full key)
const safeConfig = {...firebaseConfig};
if (safeConfig.apiKey) {
  const length = safeConfig.apiKey.length;
  safeConfig.apiKey = `${safeConfig.apiKey.substring(0, 6)}...${safeConfig.apiKey.substring(length-4)} (length: ${length})`;
}
console.log('Firebase config:', safeConfig);

// Regular Firebase initialization
console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
console.log('Firebase initialized successfully');

export { app, auth, db, storage };