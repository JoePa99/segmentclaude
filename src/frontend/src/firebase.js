// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

console.log('Firebase initialization starting...');

// Create an anonymous authentication solution
class MockFirebase {
  constructor() {
    console.log('Creating mock Firebase solution');
    
    // Track if user is signed in
    this._isSignedIn = false;
    this._authListeners = [];
    this._user = null;
    this._userProfile = null;
  }
  
  // Main authentication methods
  signIn(email) {
    console.log('Mock sign in with:', email);
    this._isSignedIn = true;
    
    // Create user object
    this._user = {
      uid: `user-${Date.now()}`,
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true
    };
    
    // Create user profile
    this._userProfile = {
      firstName: email.split('@')[0],
      lastName: 'User',
      email: email
    };
    
    // Notify listeners
    this._notifyAuthChange();
    
    return { user: this._user };
  }
  
  signOut() {
    console.log('Mock sign out');
    this._isSignedIn = false;
    this._user = null;
    this._userProfile = null;
    
    // Notify listeners
    this._notifyAuthChange();
  }
  
  onAuthStateChanged(callback) {
    console.log('Adding auth listener');
    this._authListeners.push(callback);
    
    // Immediately call with current state
    setTimeout(() => callback(this._user), 0);
    
    // Return unsubscribe function
    return () => {
      this._authListeners = this._authListeners
        .filter(listener => listener !== callback);
    };
  }
  
  _notifyAuthChange() {
    console.log('Notifying auth state change, user:', 
      this._user ? this._user.email : 'null');
    
    this._authListeners.forEach(callback => {
      setTimeout(() => callback(this._user), 0);
    });
  }
}

// Create mock Firebase implementation
const mockFirebase = new MockFirebase();

// Create the Firebase exports
const app = { name: 'mock-app' };

// Export auth API that wraps the mock implementation
const auth = {
  // Create stub methods for Firebase auth
  currentUser: null,
  
  signInWithEmailAndPassword: (email, password) => {
    console.log('Sign in attempt:', email);
    return Promise.resolve(mockFirebase.signIn(email));
  },
  
  createUserWithEmailAndPassword: (email, password) => {
    console.log('Create user attempt:', email);
    return Promise.resolve(mockFirebase.signIn(email));
  },
  
  signOut: () => {
    console.log('Sign out attempt');
    mockFirebase.signOut();
    return Promise.resolve();
  },
  
  onAuthStateChanged: (callback) => {
    return mockFirebase.onAuthStateChanged(callback);
  }
};

// Export simple mock DB and storage
const db = {
  collection: (name) => ({
    doc: (id) => ({
      get: () => Promise.resolve({
        exists: true,
        data: () => ({ name: 'Mock data' }),
        id
      }),
      set: (data) => Promise.resolve({ id })
    }),
    add: (data) => Promise.resolve({ 
      id: `doc-${Date.now()}`,
      get: () => Promise.resolve({
        exists: true,
        data: () => data,
        id: `doc-${Date.now()}`
      })
    })
  })
};

const storage = {
  ref: (path) => ({
    put: (file) => Promise.resolve({
      ref: {
        getDownloadURL: () => Promise.resolve(`https://example.com/${file.name}`)
      }
    })
  })
};

console.log('Mock Firebase exports ready');

export { app, auth, db, storage };