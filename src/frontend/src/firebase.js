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

// HARDCODED Firebase config for segmentation-39ffb project
// Using explicit hardcoded values to eliminate any configuration issues
const firebaseConfig = {
  apiKey: "AIzaSyDEWk9Y9U4SG-hKnBQIm9oHHvLAZRxMMW8",
  authDomain: "segmentation-39ffb.firebaseapp.com",
  projectId: "segmentation-39ffb",
  storageBucket: "segmentation-39ffb.appspot.com",
  messagingSenderId: "1094358749209",
  appId: "1:1094358749209:web:7626b5c5b1ef7a51aca5b9"
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