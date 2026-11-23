import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebase.js';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
  // Current user state (combines Firebase auth identity with MongoDB profile and role)
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Synchronize the authenticated Firebase user with the MongoDB database.
   * Receives MongoDB profile (with role: 'student' | 'eventManager').
   */
  const syncWithBackend = async (fbUser, extraData = {}) => {
    try {
      const token = await fbUser.getIdToken();

      const response = await fetch(`${API_URL}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: extraData.name || fbUser.displayName || '',
          department: extraData.department || '',
          year: extraData.year || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to sync user with server');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.warn('Backend sync warning:', error.message);
      // Fallback local representation if backend server is offline or in transition
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

  // Listen to Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);

      if (currentFbUser) {
        try {
          const profile = await syncWithBackend(currentFbUser);
          setUser(profile);
        } catch (err) {
          console.error('Error restoring session:', err);
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
   * Signup with name, email and password.
   */
  const signup = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name in Firebase Auth
    if (name) {
      try {
        await updateFirebaseProfile(userCredential.user, { displayName: name });
      } catch (e) {
        console.warn('Could not update Firebase displayName:', e);
      }
    }

    // Synchronize newly created user with MongoDB
    const syncedUser = await syncWithBackend(userCredential.user, { name });
    setUser(syncedUser);
    setFirebaseUser(userCredential.user);
    return syncedUser;
  };

  /**
   * Login with email and password.
   */
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Synchronize logged-in user with MongoDB to fetch verified role
    const syncedUser = await syncWithBackend(userCredential.user);
    setUser(syncedUser);
    setFirebaseUser(userCredential.user);
    return syncedUser;
  };

  /**
   * Logout the current user session.
   */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  /**
   * Helper to retrieve a fresh Firebase ID token for API calls.
   */
  const getIdToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  /**
   * Update profile information locally and in state.
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
