import { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth, 
  db,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection
} from '../firebase';

// Error handling function
const handleFirebaseAuthError = (error) => {
  console.error('Firebase auth error:', error.code, error.message);
  
  // Map Firebase errors to user-friendly messages
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid login credentials',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-email': 'Invalid email format',
    'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/internal-error': 'Authentication service error. Please try again later.'
  };
  
  return errorMessages[error.code] || error.message || 'An unexpected authentication error occurred';
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Log the AuthProvider initialization for debugging
  console.log('AuthProvider initializing...');

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        console.log('User is logged in, fetching profile...');
        // Get user profile from Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          console.log('Fetching user doc from Firestore:', userRef);
          
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            console.log('User profile found in Firestore');
            setUserProfile(userDoc.data());
          } else {
            console.log('No user profile in Firestore, creating basic profile');
            // Create a basic profile if none exists
            const basicProfile = {
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              createdAt: new Date()
            };
            setUserProfile(basicProfile);
            
            // Optionally save this basic profile to Firestore
            try {
              await setDoc(userRef, basicProfile);
            } catch (error) {
              console.error('Error creating basic profile:', error);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        console.log('No user logged in');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      console.log('Attempting to login with email:', email);
      
      // Create user account if it doesn't exist (for demo purposes)
      try {
        console.log('Trying to create account first (in case it doesn\'t exist)');
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Created new user account');
      } catch (createError) {
        console.log('Account creation failed (likely already exists):', createError.code);
        // Ignore error - user likely exists
      }
      
      // Regular Firebase authentication
      console.log('Calling Firebase signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase login successful', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Login error full details:', error);
      const errorMessage = handleFirebaseAuthError(error);
      console.error('Login error:', error.code, errorMessage);
      setError(errorMessage);
      throw error;
    }
  };

  // Register user
  const register = async (firstName, lastName, email, password, organization) => {
    try {
      setError(null);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Create user document in Firestore
      const userProfile = {
        firstName,
        lastName,
        email,
        organization,
        createdAt: new Date(),
        role: 'user'
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);
      
      return user;
    } catch (error) {
      const errorMessage = handleFirebaseAuthError(error);
      console.error('Registration error:', error.code, errorMessage);
      setError(errorMessage);
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...profileData,
        updatedAt: new Date()
      });
      
      // If display name is included, update Auth profile
      if (profileData.firstName && profileData.lastName) {
        await updateProfile(currentUser, {
          displayName: `${profileData.firstName} ${profileData.lastName}`
        });
      }
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...profileData
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};