import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getProfile, updateProfile } from '../controllers/userController.js';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

// GET /api/users/me - Logged in user profile
router.get('/me', getProfile);

// PATCH /api/users/me - Update profile fields (name, department, year)
router.patch('/me', updateProfile);

export default router;
