import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import { syncUser, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/sync - Sync Firebase user with MongoDB (creates student if new)
router.post('/sync', verifyToken, syncUser);

// GET /api/auth/me - Get current user profile
router.get('/me', verifyToken, getCurrentUser);

export default router;
