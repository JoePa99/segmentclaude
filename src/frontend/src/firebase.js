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

// Use these fixed Firebase config values - do NOT require env variables
// This lets us debug authentication issues more easily
const firebaseConfig = {
  apiKey: "AIzaSyA2lZ1kDFRRZ5s9vwwnCt6rdtk-3sAwzgA",
  authDomain: "newsegment-9c10a.firebaseapp.com",
  projectId: "newsegment-9c10a",
  storageBucket: "newsegment-9c10a.appspot.com",
  messagingSenderId: "891151161185",
  appId: "1:891151161185:web:11f68e4e2d07ae4c7eeae5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };