// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// SIMPLE FIREBASE CONFIGURATION
// This is a fresh Firebase project created specifically for this application
// The API key is public and restricted to this domain only
const firebaseConfig = {
  apiKey: "AIzaSyBMZrRsaDFb8o3C7Hd0dOI7n8QUbvUV6DY",
  authDomain: "newsegment-app.firebaseapp.com",
  projectId: "newsegment-app",
  storageBucket: "newsegment-app.appspot.com",
  messagingSenderId: "1071763813592",
  appId: "1:1071763813592:web:5d1e2a2c4833d8ba4a5120"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };