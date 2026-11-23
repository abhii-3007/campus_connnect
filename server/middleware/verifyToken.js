import { firebaseAuth, getAuth } from '../config/firebaseAdmin.js';
import { getApps } from 'firebase-admin/app';

/**
 * Middleware to verify Firebase ID Token in incoming requests.
 * Expects header: Authorization: Bearer <token>
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Missing or invalid Authorization header.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1]?.trim();

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.',
      });
    }

    if (!getApps().length) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin is not configured on the server.',
      });
    }

    const authInstance = firebaseAuth || getAuth();

    // Verify token with Firebase Admin
    const decodedToken = await authInstance.verifyIdToken(idToken);

    // Attach verified user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || '',
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired Firebase ID token.',
      error: error.message,
    });
  }
};

export default verifyToken;
