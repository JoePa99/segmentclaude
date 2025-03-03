class MockFirebase {
  constructor() {
    console.log('Creating mock Firebase implementation');
    
    // Create a user ID that persists in session storage
    this.userId = sessionStorage.getItem('mockUserId') || `user-${Date.now()}`;
    sessionStorage.setItem('mockUserId', this.userId);
    
    // Start with no user logged in
    this._currentUser = null;
    this._authStateListeners = [];
    
    // In-memory database collections
    this._collections = {
      users: {},
      projects: {},
      segments: {},
      uploads: {},
      focusGroups: {}
    };
    
    console.log('Mock Firebase created with user ID:', this.userId);
  }
  
  // ===== AUTH METHODS =====
  
  // For signInWithEmailAndPassword
  async signInWithEmail(email, password) {
    console.log('Mock signIn with:', email);
    
    // Create a mock user
    this._currentUser = {
      uid: this.userId,
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true,
    };
    
    // Create a user document if it doesn't exist
    if (!this._collections.users[this.userId]) {
      this._collections.users[this.userId] = {
        uid: this.userId,
        email: email,
        firstName: email.split('@')[0],
        lastName: 'User',
        createdAt: new Date().toISOString(),
        role: 'user'
      };
    }
    
    // Notify listeners
    this._notifyAuthStateChanged();
    
    return { user: this._currentUser };
  }
  
  // For createUserWithEmailAndPassword
  async createUserWithEmail(email, password) {
    console.log('Mock createUser with:', email);
    
    // Create a mock user
    this._currentUser = {
      uid: this.userId,
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true,
    };
    
    // Notify listeners
    this._notifyAuthStateChanged();
    
    return { user: this._currentUser };
  }
  
  // For signOut
  async signOut() {
    console.log('Mock signOut');
    this._currentUser = null;
    this._notifyAuthStateChanged();
    return Promise.resolve();
  }
  
  // For onAuthStateChanged
  onAuthStateChanged(callback) {
    console.log('Adding auth state listener');
    this._authStateListeners.push(callback);
    
    // Call immediately with current state
    setTimeout(() => callback(this._currentUser), 0);
    
    // Return unsubscribe function
    return () => {
      this._authStateListeners = this._authStateListeners.filter(cb => cb !== callback);
    };
  }
  
  _notifyAuthStateChanged() {
    console.log('Notifying auth state listeners, user:', this._currentUser?.email || 'null');
    this._authStateListeners.forEach(callback => {
      setTimeout(() => callback(this._currentUser), 0);
    });
  }
  
  // ===== FIRESTORE METHODS =====
  
  // Get a reference to a document
  doc(collection, id) {
    return {
      id: id,
      collection: collection,
      
      // Get document data
      async get() {
        console.log(`Mock getting doc from ${collection}/${id}`);
        const data = this._collections[collection]?.[id];
        
        return {
          exists: !!data,
          data: () => data || null,
          id: id
        };
      },
      
      // Set document data
      async set(data) {
        console.log(`Mock setting doc at ${collection}/${id}`, data);
        
        if (!this._collections[collection]) {
          this._collections[collection] = {};
        }
        
        this._collections[collection][id] = {
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        return { id };
      },
      
      // Update document data
      async update(data) {
        console.log(`Mock updating doc at ${collection}/${id}`, data);
        
        if (!this._collections[collection]) {
          this._collections[collection] = {};
        }
        
        if (!this._collections[collection][id]) {
          this._collections[collection][id] = {};
        }
        
        this._collections[collection][id] = {
          ...this._collections[collection][id],
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        return { id };
      }
    };
  }
  
  // Get a reference to a collection
  collection(name) {
    return {
      name: name,
      
      // Add a document to a collection
      async add(data) {
        const id = `mock-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        console.log(`Mock adding doc to ${name} with id ${id}`, data);
        
        if (!this._collections[name]) {
          this._collections[name] = {};
        }
        
        this._collections[name][id] = {
          ...data,
          createdAt: new Date().toISOString()
        };
        
        return { 
          id,
          get: async () => ({
            exists: true,
            data: () => this._collections[name][id],
            id
          })
        };
      },
      
      // Query a collection
      where() {
        return {
          get: async () => {
            console.log(`Mock querying ${name}`);
            const docs = Object.entries(this._collections[name] || {}).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true
            }));
            
            return {
              docs,
              empty: docs.length === 0,
              size: docs.length
            };
          }
        };
      }
    };
  }
}

// Create a mock Firebase implementation
const mockFirebase = new MockFirebase();

// Export mock Firebase objects
const app = { name: 'mock-app' };
const auth = {
  currentUser: null,
  signInWithEmailAndPassword: (email, password) => mockFirebase.signInWithEmail(email, password),
  createUserWithEmailAndPassword: (email, password) => mockFirebase.createUserWithEmail(email, password),
  signOut: () => mockFirebase.signOut(),
  onAuthStateChanged: (callback) => mockFirebase.onAuthStateChanged(callback),
  updateProfile: (user, data) => {
    console.log('Mock updateProfile:', data);
    if (mockFirebase._currentUser) {
      mockFirebase._currentUser = {
        ...mockFirebase._currentUser,
        ...data
      };
    }
    return Promise.resolve();
  }
};
const db = {
  collection: (name) => mockFirebase.collection(name),
  doc: (collection, id) => mockFirebase.doc(collection, id)
};
const storage = {
  ref: (path) => ({
    put: (file) => Promise.resolve({
      ref: {
        getDownloadURL: () => Promise.resolve(`https://mock-storage.com/${path}/${file.name}`)
      }
    })
  })
};

console.log('Mock Firebase exported');

export { app, auth, db, storage };