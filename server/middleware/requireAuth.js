import { firebaseAuth, getAuth } from '../config/firebaseAdmin.js';
import { getApps } from 'firebase-admin/app';
import User from '../models/User.js';

/**
 * requireAuth middleware:
 * 1. Reads Firebase ID token from Authorization header (Bearer <token>).
 * 2. Verifies the token with Firebase Admin SDK.
 * 3. Finds the matching user in MongoDB via firebaseUid.
 * 4. Attaches the complete trusted MongoDB user document to req.user.
 * 5. Rejects unauthenticated or unregistered requests with HTTP 401.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Authorization header missing or malformed.',
      });
    }

    const token = authHeader.split('Bearer ')[1]?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Token is empty.',
      });
    }

    if (!getApps().length) {
      return res.status(500).json({
        success: false,
        message: 'Server error: Firebase Admin is not configured.',
      });
    }

    const authInstance = firebaseAuth || getAuth();

    // Verify token with Firebase Admin
    const decodedToken = await authInstance.verifyIdToken(token);

    // Look up the full trusted user document in MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not registered in database. Please sync account first.',
      });
    }

    // Attach complete trusted user object from MongoDB to req.user
    req.user = user;
    next();
  } catch (error) {
    console.error('requireAuth verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid or expired token.',
      error: error.message,
    });
  }
};

export default requireAuth;
