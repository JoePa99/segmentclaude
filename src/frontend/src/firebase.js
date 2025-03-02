// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Log environment information for debugging
console.log('Environment mode:', import.meta.env.MODE);
console.log('Firebase API key status:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Defined' : 'Undefined');
// Log the first few characters of the key to verify it's not malformed
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
if (apiKey) {
  console.log('Firebase API key prefix:', apiKey.substring(0, 8) + '...');
  console.log('Firebase API key length:', apiKey.length);
}

// Try a completely different Firebase project
// The original key may have been revoked or is invalid
const firebaseConfig = {
  apiKey: "AIzaSyCIhMRF7-V0yqi7h-e1hhI2aDyRmO1M7TE",
  authDomain: "simple-ai-app-3a33c.firebaseapp.com",
  projectId: "simple-ai-app-3a33c",
  storageBucket: "simple-ai-app-3a33c.appspot.com",
  messagingSenderId: "329607346987",
  appId: "1:329607346987:web:bfff8a38db69ed81d87bb2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };