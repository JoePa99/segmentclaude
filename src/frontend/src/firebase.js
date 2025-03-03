// Simple Firebase Stub for Testing
console.log('Initializing Firebase stub for testing');

// Mock Firebase services
const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    console.log('Stub: onAuthStateChanged called');
    // Call callback with null (not logged in)
    setTimeout(() => callback(null), 0);
    return () => {}; // Return unsubscribe function
  },
  signInWithEmailAndPassword: (email, password) => {
    console.log('Stub: signInWithEmailAndPassword called with', email);
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
    console.log('Stub: signOut called');
    return Promise.resolve();
  },
  createUserWithEmailAndPassword: (email, password) => {
    console.log('Stub: createUserWithEmailAndPassword called with', email);
    return Promise.resolve({
      user: {
        uid: 'new-test-user-' + Date.now(),
        email,
        displayName: null,
        emailVerified: false
      }
    });
  }
};

// Mock Firestore
const db = {
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

// Mock Storage
const storage = {
  ref: () => ({
    put: () => Promise.resolve({
      ref: {
        getDownloadURL: () => Promise.resolve('https://example.com/mock-download-url')
      }
    })
  })
};

console.log('Firebase stub initialized successfully');

export { auth, db, storage };