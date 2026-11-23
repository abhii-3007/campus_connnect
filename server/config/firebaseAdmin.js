import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

/**
 * Initialize Firebase Admin SDK safely using environment variables.
 * Supports:
 * 1. Service account JSON file: FIREBASE_SERVICE_ACCOUNT_PATH
 * 2. Individual credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
let firebaseApp = null;
let firebaseAuth = null;

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
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
  firebaseAuth = getAuth();
}

export { firebaseApp, firebaseAuth, getAuth };
export default firebaseAuth;
