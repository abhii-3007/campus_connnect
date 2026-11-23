import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import { getMyRegistrations } from '../controllers/registrationController.js';

const router = express.Router();

// All registration routes require authentication
router.use(requireAuth);

// GET /api/registrations/me - Logged in student's registered events
router.get('/me', requireRole('student'), getMyRegistrations);

export default router;
