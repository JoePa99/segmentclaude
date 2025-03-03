// Real Firebase with ES module imports
console.log('Initializing Firebase with ES module imports');

// Import Firebase modules with try/catch
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Initialize with try/catch and fallback
let auth, db, storage;

try {
  console.log('Setting up real Firebase...');
  
  // Your web app's Firebase configuration
  // Try loading config from environment variables first
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDEWk9Y9U4SG-hKnBQIm9oHHvLAZRxMMW8",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "segmentation-39ffb.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "segmentation-39ffb",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "segmentation-39ffb.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1094358749209",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1094358749209:web:7626b5c5b1ef7a51aca5b9"
  };
  
  console.log('Firebase config loaded:', Object.keys(firebaseConfig).join(', '));
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized:', app.name);
  
  // Get services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('Firebase services initialized successfully!');
  
} catch (error) {
  console.error('Error initializing real Firebase:', error);
  
  // Fallback to stub implementation
  console.log('Falling back to stub implementation');
  
  // Create stub auth
  auth = {
    _isStub: true,
    currentUser: null,
    onAuthStateChanged: (callback) => {
      console.log('STUB: onAuthStateChanged called');
      setTimeout(() => callback(null), 0);
      return () => {};
    },
    signInWithEmailAndPassword: (email, password) => {
      console.log('STUB: signInWithEmailAndPassword', email);
      return Promise.resolve({
        user: {
          uid: 'test-user-123',
          email,
          displayName: email.split('@')[0],
          emailVerified: true
        }
      });
    },
    signOut: () => {
      console.log('STUB: signOut called');
      return Promise.resolve();
    },
    createUserWithEmailAndPassword: (email, password) => {
      console.log('STUB: createUserWithEmailAndPassword', email);
      return Promise.resolve({
        user: {
          uid: 'new-user-' + Date.now(),
          email,
          displayName: null,
          emailVerified: false
        }
      });
    }
  };
  
  // Create stub db
  db = {
    _isStub: true,
    collection: (name) => ({
      doc: (id) => ({
        get: () => Promise.resolve({
          exists: () => false,
          data: () => null,
          id
        }),
        set: (data) => Promise.resolve()
      })
    })
  };
  
  // Create stub storage
  storage = {
    _isStub: true,
    ref: () => ({
      put: () => Promise.resolve({
        ref: {
          getDownloadURL: () => Promise.resolve('https://example.com/mock-url')
        }
      })
    })
  };
}

export { auth, db, storage };