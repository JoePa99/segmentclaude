// Production-ready Firebase implementation
console.log('Initializing Firebase for production');

// Import Firebase core
import { initializeApp } from 'firebase/app';

// Import auth modules
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// Import firestore modules
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDM4-EkqTIAPoeTtVaE0brYz3A8VCgVpsc",
  authDomain: "segmentation-39ffb.firebaseapp.com",
  projectId: "segmentation-39ffb",
  storageBucket: "segmentation-39ffb.appspot.com",
  messagingSenderId: "1094358749209",
  appId: "1:1094358749209:web:7626b5c5b1ef7a51aca5b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase services initialized successfully');

// Export Firebase instances
export { 
  app, 
  auth, 
  db, 
  storage,
  // Auth methods
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  // Firestore methods
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  // Storage methods
  ref,
  uploadBytes,
  getDownloadURL
};