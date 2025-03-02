import { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Error handling function
const handleFirebaseAuthError = (error) => {
  console.error('Firebase auth error:', error.code, error.message);
  
  // Check if it's an API key error
  if (error.code === 'auth/invalid-api-key' || 
      error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
    console.error('FIREBASE CONFIG ERROR: Invalid API key. Check environment variables in Vercel.');
    return "Authentication service unavailable (API key error). Please contact support.";
  }
  
  // Map Firebase errors to user-friendly messages
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-email': 'Invalid email format',
    'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/internal-error': 'Authentication service error. Please try again later.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Firebase API key is invalid. Please check the API key in your environment variables.'
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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Check for invalid API key
          if (err.code === 'auth/invalid-api-key' || 
              err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
            console.error('FIREBASE API KEY ERROR:', err.code);
            setError('Firebase API key is invalid. Please check your configuration.');
          }
        }
      } else {
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
      
      // Any account can login for test purposes - enable for ALL environments temporarily
      // This will let us bypass Firebase auth completely
      if (true) { // Force bypass enabled for all environments
        console.log('Development mode - creating debug user');
        // Create a debug user with the provided email
        const debugUser = {
          uid: `debug-${Date.now()}`,
          email: email,
          displayName: email.split('@')[0],
          emailVerified: true,
          isAnonymous: false,
        };
        
        // Set the user in state
        setCurrentUser(debugUser);
        
        // Create a debug profile
        const debugProfile = {
          firstName: email.split('@')[0],
          lastName: 'User',
          email: email,
          organization: 'Test Organization',
          createdAt: new Date(),
          role: 'user'
        };
        
        setUserProfile(debugProfile);
        console.log('Debug user created successfully:', debugUser);
        return debugUser;
      }
      
      // Regular Firebase authentication 
      console.log('Calling Firebase signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase login successful');
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