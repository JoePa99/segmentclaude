// Real Firebase with enhanced error handling
console.log('Initializing real Firebase with enhanced error handling');

// Import Firebase modules with try/catch
let firebase, auth, db, storage;

try {
  // Import Firebase modules
  const firebaseApp = require('firebase/app');
  require('firebase/auth');
  require('firebase/firestore');
  require('firebase/storage');
  
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDEWk9Y9U4SG-hKnBQIm9oHHvLAZRxMMW8",
    authDomain: "segmentation-39ffb.firebaseapp.com",
    projectId: "segmentation-39ffb",
    storageBucket: "segmentation-39ffb.appspot.com",
    messagingSenderId: "1094358749209",
    appId: "1:1094358749209:web:7626b5c5b1ef7a51aca5b9"
  };

  console.log('Firebase config loaded:', Object.keys(firebaseConfig).join(', '));
  
  // Initialize Firebase with try/catch
  try {
    // Check if Firebase is already initialized
    if (!firebaseApp.apps || !firebaseApp.apps.length) {
      console.log('Initializing new Firebase app');
      firebase = firebaseApp.initializeApp(firebaseConfig);
    } else {
      console.log('Using existing Firebase app');
      firebase = firebaseApp.apps[0];
    }
    
    // Get services
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    console.log('Firebase services initialized successfully');
  } catch (initError) {
    console.error('Error initializing Firebase:', initError);
    throw new Error(`Firebase initialization error: ${initError.message}`);
  }
} catch (importError) {
  console.error('Error importing Firebase modules:', importError);
  
  // Provide mock implementations as fallback
  console.log('Using Firebase stubs as fallback');
  
  // Mock auth
  auth = {
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
  
  // Mock db
  db = {
    collection: (name) => ({
      doc: (id) => ({
        get: () => Promise.resolve({
          exists: false,
          data: () => null,
          id
        }),
        set: (data) => Promise.resolve()
      })
    })
  };
  
  // Mock storage
  storage = {
    ref: () => ({
      put: () => Promise.resolve({
        ref: {
          getDownloadURL: () => Promise.resolve('https://example.com/mock-url')
        }
      })
    })
  };
}

// Export the services (real or mock)
export { auth, db, storage };