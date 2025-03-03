// Firebase implementation using original project
console.log('Initializing Firebase with original project');

// Import Firebase core
import { initializeApp } from 'firebase/app';

// Import auth modules
import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseAuthState
} from 'firebase/auth';

// Import firestore modules
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Initialize with try/catch and fallback
let app, authInstance, dbInstance, storageInstance;

try {
  console.log('Setting up real Firebase with original project...');
  
  // Original Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDEWk9Y9U4SG-hKnBQIm9oHHvLAZRxMMW8",
    authDomain: "segmentation-39ffb.firebaseapp.com",
    projectId: "segmentation-39ffb",
    storageBucket: "segmentation-39ffb.appspot.com",
    messagingSenderId: "1094358749209",
    appId: "1:1094358749209:web:7626b5c5b1ef7a51aca5b9"
  };
  
  console.log('Using original project config');
  
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized:', app.name);
  
  // Get service instances
  authInstance = getAuth(app);
  console.log('Firebase Auth instance created');
  
  dbInstance = getFirestore(app);
  console.log('Firebase Firestore instance created');
  
  storageInstance = getStorage(app);
  console.log('Firebase Storage instance created');
  
  console.log('All Firebase services initialized successfully');
  
} catch (error) {
  console.error('Error initializing real Firebase:', error);
  console.warn('Will use stub implementation instead');
  
  // Use null instances to trigger fallback
  authInstance = null;
  dbInstance = null;
  storageInstance = null;
}

// Create our wrapped auth API
const auth = {
  // Flag to check if we're using stub implementation
  get _isStub() {
    return !authInstance;
  },
  
  // Current user
  get currentUser() {
    return authInstance ? authInstance.currentUser : null;
  },
  
  // Sign in
  signInWithEmailAndPassword: (email, password) => {
    console.log(`Attempting to sign in with email: ${email}`);
    
    if (authInstance) {
      console.log('Using real Firebase signIn');
      return firebaseSignIn(authInstance, email, password);
    } else {
      console.log('Using stub signIn');
      return Promise.resolve({
        user: {
          uid: 'test-user-123',
          email,
          displayName: email.split('@')[0],
          emailVerified: true
        }
      });
    }
  },
  
  // Create user
  createUserWithEmailAndPassword: (email, password) => {
    console.log(`Attempting to create user with email: ${email}`);
    
    if (authInstance) {
      console.log('Using real Firebase createUser');
      return firebaseCreateUser(authInstance, email, password);
    } else {
      console.log('Using stub createUser');
      return Promise.resolve({
        user: {
          uid: 'new-user-' + Date.now(),
          email,
          displayName: null,
          emailVerified: false
        }
      });
    }
  },
  
  // Sign out
  signOut: () => {
    console.log('Attempting to sign out');
    
    if (authInstance) {
      console.log('Using real Firebase signOut');
      return firebaseSignOut(authInstance);
    } else {
      console.log('Using stub signOut');
      return Promise.resolve();
    }
  },
  
  // Auth state listener
  onAuthStateChanged: (callback) => {
    console.log('Setting up auth state listener');
    
    if (authInstance) {
      console.log('Using real Firebase auth state listener');
      return firebaseAuthState(authInstance, callback);
    } else {
      console.log('Using stub auth state listener');
      setTimeout(() => callback(null), 0);
      return () => {};
    }
  }
};

// Create our wrapped Firestore API
const db = {
  _isStub: !dbInstance,
  
  // Collection reference
  collection: (name) => {
    console.log(`Accessing collection: ${name}`);
    
    if (dbInstance) {
      // Use real Firestore
      return dbInstance.collection(name);
    } else {
      // Use stub
      return {
        doc: (id) => ({
          get: () => Promise.resolve({
            exists: () => false,
            data: () => null,
            id
          }),
          set: (data) => Promise.resolve(),
          update: (data) => Promise.resolve()
        }),
        add: (data) => Promise.resolve({ id: 'doc-' + Date.now() })
      };
    }
  }
};

// Create our wrapped Storage API
const storage = {
  _isStub: !storageInstance,
  
  // Storage reference
  ref: (path) => {
    console.log(`Accessing storage path: ${path}`);
    
    if (storageInstance) {
      // Use real Storage
      return storageInstance.ref(path);
    } else {
      // Use stub
      return {
        put: (file) => Promise.resolve({
          ref: {
            getDownloadURL: () => Promise.resolve('https://example.com/mock-url')
          }
        }),
        child: (childPath) => ({
          put: (file) => Promise.resolve({
            ref: {
              getDownloadURL: () => Promise.resolve('https://example.com/mock-url')
            }
          })
        })
      };
    }
  }
};

console.log(`Firebase initialization complete. Mode: ${auth._isStub ? 'STUB' : 'REAL'}`);

export { auth, db, storage };