import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/firebase.js';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

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
      console.warn('Backend sync notice:', error.message);
      return {
        id: fbUser.uid,
        firebaseUid: fbUser.uid,
        name: extraData.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Campus Member',
        email: fbUser.email,
        role: 'student',
        department: extraData.department || '',
        year: extraData.year || '',
      };
    }
  };

  // Track Firebase auth session changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (currentFbUser) => {
          if (!isMounted) return;
          setFirebaseUser(currentFbUser);

          if (currentFbUser) {
            try {
              const profile = await syncWithBackend(currentFbUser);
              if (isMounted) setUser(profile);
            } catch (err) {
              console.warn('Session restoration error:', err);
              if (isMounted) setUser(null);
            }
          } else {
            if (isMounted) setUser(null);
          }

          if (isMounted) setLoading(false);
        },
        (error) => {
          console.warn('onAuthStateChanged error:', error.message);
          if (isMounted) setLoading(false);
        }
      );

      // Safety fallback to guarantee loading state completes
      const timeout = setTimeout(() => {
        if (isMounted) setLoading(false);
      }, 1500);

      return () => {
        isMounted = false;
        clearTimeout(timeout);
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (e) {
      console.warn('Auth listener init error:', e.message);
      setLoading(false);
    }
  }, []);

  /**
   * User Signup
   */
  const signup = async (name, email, password) => {
    if (!auth || !isFirebaseConfigured) {
      // Demo signup fallback if Firebase keys are not populated
      const demoUser = {
        id: 'student_' + Date.now(),
        firebaseUid: 'student_' + Date.now(),
        name: name || 'Student Member',
        email: email,
        role: 'student',
        department: 'General Studies',
        year: '1st Year',
      };
      setUser(demoUser);
      return demoUser;
    }

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
    if (!auth || !isFirebaseConfigured) {
      // Demo login fallback if Firebase keys are not populated
      const isManagerEmail = email.toLowerCase().includes('manager') || email.toLowerCase().includes('admin');
      const demoUser = {
        id: isManagerEmail ? 'manager_demo_1' : 'student_demo_1',
        firebaseUid: isManagerEmail ? 'manager_demo_1' : 'student_demo_1',
        name: isManagerEmail ? 'Demo Event Manager' : 'Demo Student',
        email: email,
        role: isManagerEmail ? 'eventManager' : 'student',
        department: isManagerEmail ? 'Student Affairs' : 'Computer Science',
        year: isManagerEmail ? 'Staff' : '3rd Year',
      };
      setUser(demoUser);
      return demoUser;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const syncedUser = await syncWithBackend(userCredential.user);
    setUser(syncedUser);
    setFirebaseUser(userCredential.user);
    return syncedUser;
  };

  /**
   * Demo direct login helper (instant access for testing)
   */
  const demoLogin = (role = 'student') => {
    const isManager = role === 'eventManager';
    const demoUser = {
      id: isManager ? 'manager_demo_1' : 'student_demo_1',
      firebaseUid: isManager ? 'manager_demo_1' : 'student_demo_1',
      name: isManager ? 'Demo Event Manager' : 'Demo Student',
      email: isManager ? 'manager@campus.edu' : 'student@campus.edu',
      role: isManager ? 'eventManager' : 'student',
      department: isManager ? 'Student Affairs' : 'Computer Science',
      year: isManager ? 'Staff' : '3rd Year',
    };
    setUser(demoUser);
    return demoUser;
  };

  /**
   * User Logout
   */
  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase signout warning:', e);
      }
    }
    setUser(null);
    setFirebaseUser(null);
  };

  const getIdToken = async () => {
    if (auth?.currentUser) {
      try {
        return await auth.currentUser.getIdToken();
      } catch (_) {
        return null;
      }
    }
    return null;
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signup,
    login,
    demoLogin,
    logout,
    getIdToken,
    updateProfile,
    isFirebaseConfigured,
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
