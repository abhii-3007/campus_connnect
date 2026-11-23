import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Safe configuration reading with fallback defaults to prevent initialization crashes
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key-campus-connect';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'campus-connect-demo';

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
};

// Check if actual credentials have been supplied by user
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_firebase_api_key' &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('demo')
);

let app = null;
let auth = null;
let rtdb = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  rtdb = getDatabase(app);
} catch (error) {
  console.warn('Firebase initialization notice:', error.message);
}

export { app, auth, rtdb };
export default app;
