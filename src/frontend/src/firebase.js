// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Debug logging to help diagnose issues
console.log('Firebase initialization starting...');
console.log('Environment:', import.meta.env.MODE);

// Create a diagnostic logging function
const logFirebaseConfig = (config) => {
  // Print a safe version of the config (without showing full API key)
  const safeConfig = {...config};
  if (safeConfig.apiKey) {
    const length = safeConfig.apiKey.length;
    safeConfig.apiKey = `${safeConfig.apiKey.substring(0, 6)}...${safeConfig.apiKey.substring(length-4)} (length: ${length})`;
  }
  console.log('Firebase config being used:', safeConfig);
};

// Firebase configuration for segmentaizer.com
// This is the proper production configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHI-e9uzItJ6ZAD1NWpwZK7PEGxzjTX3c",
  authDomain: "segmentaizer.firebaseapp.com",
  projectId: "segmentaizer",
  storageBucket: "segmentaizer.appspot.com",
  messagingSenderId: "539243581112",
  appId: "1:539243581112:web:c20e47e4a0fb59ecc8fd4b"
};

// Log the configuration being used
logFirebaseConfig(firebaseConfig);

// Initialize Firebase with more robust error handling
let app;
let auth;
let db;
let storage;

try {
  console.log('Initializing Firebase app...');
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  console.log('Initializing Firebase auth...');
  auth = getAuth(app);
  console.log('Firebase auth initialized successfully');
  
  console.log('Initializing Firestore...');
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
  
  console.log('Initializing Storage...');
  storage = getStorage(app);
  console.log('Storage initialized successfully');
  
  // Use local emulator in development if available
  if (import.meta.env.MODE === 'development' && window.location.hostname === 'localhost') {
    console.log('Development environment detected, checking for emulators...');
    
    try {
      // Connect to Auth emulator if running locally
      console.log('Connecting to Auth emulator...');
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      console.log('Connected to Auth emulator');
      
      // Connect to Firestore emulator
      console.log('Connecting to Firestore emulator...');
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      console.log('Connected to Firestore emulator');
      
      // Connect to Storage emulator
      console.log('Connecting to Storage emulator...');
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      console.log('Connected to Storage emulator');
    } catch (emulatorError) {
      console.error('Failed to connect to emulators:', emulatorError);
      console.log('Continuing with production services');
    }
  }
  
  console.log('Firebase services initialized successfully!');
} catch (error) {
  console.error('ERROR INITIALIZING FIREBASE:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  
  // Create fallback instances to prevent app crashes
  if (!app) app = { name: 'fallback-app' };
  if (!auth) auth = { 
    currentUser: null,
    onAuthStateChanged: (callback) => { callback(null); return () => {}; },
    signInWithEmailAndPassword: () => Promise.reject(new Error('Auth not available')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Auth not available')),
    signOut: () => Promise.resolve()
  };
  if (!db) db = { collection: () => ({}) };
  if (!storage) storage = { ref: () => ({}) };
}

export { app, auth, db, storage };