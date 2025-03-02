// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Log environment information for debugging
console.log('Environment mode:', import.meta.env.MODE);
console.log('Firebase API key status:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Defined' : 'Undefined');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA2lZ1kDFRRZ5s9vwwnCt6rdtk-3sAwzgA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "newsegment-9c10a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "newsegment-9c10a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "newsegment-9c10a.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "891151161185",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:891151161185:web:11f68e4e2d07ae4c7eeae5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };