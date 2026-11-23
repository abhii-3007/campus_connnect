import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { notifyStudentsNewEvent } from '../services/notificationService.js';

/**
 * GET /api/events
 * Return all available events ordered by date.
 * Optional query parameter: ?search=<title-query>
 */
export const getAllEvents = async (req, res) => {
  try {
    const { search } = req.query;

    const query = {};
    if (search && typeof search === 'string' && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .populate('createdBy', 'name email department');

    // Attach registered count for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await Registration.countDocuments({ eventId: event._id });
        return {
          ...event.toObject(),
          registeredCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: eventsWithCounts.length,
      events: eventsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve events.',
      error: error.message,
    });
  }
};

/**
 * GET /api/events/:id
 * Return details for a specific event.
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findById(id).populate('createdBy', 'name email department');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const registeredCount = await Registration.countDocuments({ eventId: event._id });

    return res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        registeredCount,
      },
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details.',
      error: error.message,
    });
  }
};

/**
 * POST /api/events
 * Only eventManager.
 * Validate required fields and associate createdBy with req.user._id.
 * Dispatches real-time student notifications via Firebase Realtime Database.
 */
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, capacity } = req.body;

    // Validate presence of required fields
    if (!title?.trim() || !description?.trim() || !date || !time?.trim() || !venue?.trim() || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: title, description, date, time, venue, and capacity.',
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format.',
      });
    }

    const parsedCapacity = Number(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0 || !Number.isInteger(parsedCapacity)) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a positive whole number.',
      });
    }

    // 1. Save event in MongoDB
    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      date: parsedDate,
      time: time.trim(),
      venue: venue.trim(),
      capacity: parsedCapacity,
      createdBy: req.user._id,
    });

    const populatedEvent = await event.populate('createdBy', 'name email department');

    // 2. Trigger non-blocking real-time notification to students
    notifyStudentsNewEvent(event).catch((err) => {
      console.error('Non-blocking notification error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: {
        ...populatedEvent.toObject(),
        registeredCount: 0,
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event.',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/events/:id
 * Only eventManager.
 * Creator check: only creator can update.
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, venue, capacity } = req.body;

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

    // Authorization: Only the creator may edit the event
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update events that you created.',
      });
    }

    // Input validations for updated fields
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Title cannot be empty.' });
      }
      event.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ success: false, message: 'Description cannot be empty.' });
      }
      event.description = description.trim();
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format.' });
      }
      event.date = parsedDate;
    }

    if (time !== undefined) {
      if (typeof time !== 'string' || !time.trim()) {
        return res.status(400).json({ success: false, message: 'Time cannot be empty.' });
      }
      event.time = time.trim();
    }

    if (venue !== undefined) {
      if (typeof venue !== 'string' || !venue.trim()) {
        return res.status(400).json({ success: false, message: 'Venue cannot be empty.' });
      }
      event.venue = venue.trim();
    }

    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);
      if (isNaN(parsedCapacity) || parsedCapacity <= 0 || !Number.isInteger(parsedCapacity)) {
        return res.status(400).json({ success: false, message: 'Capacity must be a positive whole number.' });
      }
      // Ensure capacity is not reduced below existing registration count
      const registeredCount = await Registration.countDocuments({ eventId: event._id });
      if (parsedCapacity < registeredCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity to ${parsedCapacity}. Current registrations: ${registeredCount}.`,
        });
      }
      event.capacity = parsedCapacity;
    }

    await event.save();
    const updated = await event.populate('createdBy', 'name email department');
    const registeredCount = await Registration.countDocuments({ eventId: event._id });

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: {
        ...updated.toObject(),
        registeredCount,
      },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/events/:id
 * Only eventManager.
 * Creator check: only creator can delete.
 * Automatically cleans up existing registrations.
 */
export const deleteEvent = async (req, res) => {
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

    // Authorization: Only the creator may delete the event
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete events that you created.',
      });
    }

    // Clean up all registrations tied to this event
    const deletedRegistrations = await Registration.deleteMany({ eventId: event._id });

    // Delete the event
    await event.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Event and associated registrations deleted successfully.',
      details: {
        eventId: id,
        registrationsRemoved: deletedRegistrations.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event.',
      error: error.message,
    });
  }
};
