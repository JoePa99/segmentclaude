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

// Simple error handler for the mock Firebase
const handleFirebaseAuthError = (error) => {
  console.error('Firebase auth error:', error);
  
  // Just return a generic message since we're using mock Firebase
  return "Authentication error. Please try again.";
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
      
      // Demo account special case
      if (email === 'demo@example.com' && password === 'demo123') {
        console.log('Using demo account');
        // This code only runs if someone uses the exact demo credentials
        // But we'll still use Firebase for auth
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