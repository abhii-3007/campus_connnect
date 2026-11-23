import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

/**
 * Initialize Firebase Admin SDK safely using environment variables.
 * Configures both Auth and Realtime Database.
 */
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

if (!getApps().length) {
  try {
    const databaseURL =
      process.env.FIREBASE_DATABASE_URL ||
      (process.env.FIREBASE_PROJECT_ID
        ? `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        : undefined);

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL,
      });
      console.log('Firebase Admin initialized using service account file.');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL,
      });
      console.log('Firebase Admin initialized using environment variables.');
    } else {
      console.warn('Firebase Admin credentials not set in environment. Protected endpoints will require valid credentials.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
  }
} else {
  firebaseApp = getApps()[0];
}

if (getApps().length) {
  try {
    firebaseAuth = getAuth();
  } catch (err) {
    console.error('Error getting Firebase Auth instance:', err.message);
  }
  try {
    firebaseDb = getDatabase();
  } catch (err) {
    console.warn('Error getting Firebase Database instance:', err.message);
  }
}

export { firebaseApp, firebaseAuth, firebaseDb, getAuth, getDatabase };
export default firebaseAuth;
