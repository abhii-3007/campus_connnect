import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebase.js';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

/**
 * Translates Firebase Auth error codes into clear, beginner-friendly messages.
 */
export function formatAuthError(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'The email address format is not valid.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few minutes and try again.';
    default:
      return 'An unexpected error occurred during authentication. Please try again.';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authenticated Firebase user with MongoDB database
  const syncWithBackend = async (fbUser, extraData = {}) => {
    try {
      const response = await authService.syncUser({
        name: extraData.name || fbUser.displayName || '',
        department: extraData.department || '',
        year: extraData.year || '',
      });
      return response.user;
    } catch (error) {
      console.warn('Backend sync warning:', error.message);
      // Temporary local fallback if backend is momentarily unreachable
      return {
        id: fbUser.uid,
        firebaseUid: fbUser.uid,
        name: extraData.name || fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        role: 'student', // Default rule
        department: extraData.department || '',
        year: extraData.year || '',
      };
    }
  };

  // Track Firebase auth session changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);

      if (currentFbUser) {
        try {
          const profile = await syncWithBackend(currentFbUser);
          setUser(profile);
        } catch (err) {
          console.error('Session restoration error:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * User Signup
   */
  const signup = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (name) {
      try {
        await updateFirebaseProfile(userCredential.user, { displayName: name });
      } catch (e) {
        console.warn('Could not set displayName on Firebase user:', e);
      }
    }

    const syncedUser = await syncWithBackend(userCredential.user, { name });
    setUser(syncedUser);
    setFirebaseUser(userCredential.user);
    return syncedUser;
  };

  /**
   * User Login
   */
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const syncedUser = await syncWithBackend(userCredential.user);
    setUser(syncedUser);
    setFirebaseUser(userCredential.user);
    return syncedUser;
  };

  /**
   * User Logout
   */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  /**
   * Retrieve fresh Firebase ID Token
   */
  const getIdToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  /**
   * Update profile state locally
   */
  const updateProfile = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signup,
    login,
    logout,
    getIdToken,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
