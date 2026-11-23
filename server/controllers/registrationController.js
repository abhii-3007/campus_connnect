import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

/**
 * POST /api/events/:id/register
 * Only student.
 * 1. Verify event exists.
 * 2. Reject registration for past events.
 * 3. Check whether student has already registered.
 * 4. Check event capacity.
 * 5. Save new Registration document.
 */
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Check if event is in the past
    // Compares event date with current date (normalizing to midnight UTC for fairness)
    const now = new Date();
    const eventDate = new Date(event.date);

    // If event date is strictly before start of today, reject
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (eventDate < startOfToday) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for past events.',
      });
    }

    // Check for existing registration
    const existingRegistration = await Registration.findOne({
      studentId: req.user._id,
      eventId: event._id,
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    // Check capacity
    const registeredCount = await Registration.countDocuments({ eventId: event._id });
    if (registeredCount >= event.capacity) {
      return res.status(409).json({
        success: false,
        message: 'Registration full. This event has reached its maximum capacity.',
      });
    }

    // Create registration
    const registration = await Registration.create({
      studentId: req.user._id,
      eventId: event._id,
      registeredAt: new Date(),
    });

    const populatedRegistration = await registration.populate('eventId', 'title date time venue capacity');

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Your spot is reserved.',
      registration: populatedRegistration,
    });
  } catch (error) {
    // Check if MongoDB compound unique index caught a concurrent duplicate
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    console.error('Error during event registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process event registration.',
      error: error.message,
    });
  }
};

/**
 * GET /api/registrations/me
 * Only student.
 * Return the logged-in student's registrations and corresponding event details.
 */
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ studentId: req.user._id })
      .sort({ registeredAt: -1 })
      .populate({
        path: 'eventId',
        populate: {
          path: 'createdBy',
          select: 'name email department',
        },
      });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error('Error fetching student registrations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations.',
      error: error.message,
    });
  }
};

/**
 * GET /api/events/:id/registrations
 * Only eventManager.
 * Creator check: only creator can view registrations.
 * Return registered students for that event.
 */
export const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Authorization: Only the creator of this event may view the registered students
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only view registrations for events that you created.',
      });
    }

    const registrations = await Registration.find({ eventId: event._id })
      .sort({ registeredAt: -1 })
      .populate('studentId', 'name email department year');

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        capacity: event.capacity,
        registeredCount: registrations.length,
      },
      registrations: registrations.map((r) => ({
        id: r._id,
        registeredAt: r.registeredAt,
        student: r.studentId,
      })),
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event registrations.',
      error: error.message,
    });
  }
};
