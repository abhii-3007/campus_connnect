import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

// All notification actions require authentication
router.use(requireAuth);

// PATCH /api/notifications/:id/read - Mark user's notification as read
router.patch('/:id/read', markAsRead);

export default router;
