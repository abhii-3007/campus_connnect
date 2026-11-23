import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import {
  registerForEvent,
  getEventRegistrations,
} from '../controllers/registrationController.js';

const router = express.Router();

// Public routes: Anyone can list and view event details
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes: Only authenticated eventManager can create, edit, or delete events
router.post('/', requireAuth, requireRole('eventManager'), createEvent);
router.patch('/:id', requireAuth, requireRole('eventManager'), updateEvent);
router.delete('/:id', requireAuth, requireRole('eventManager'), deleteEvent);

// Registration sub-routes:
// POST /api/events/:id/register (student only)
router.post('/:id/register', requireAuth, requireRole('student'), registerForEvent);

// GET /api/events/:id/registrations (eventManager creator only)
router.get('/:id/registrations', requireAuth, requireRole('eventManager'), getEventRegistrations);

export default router;
