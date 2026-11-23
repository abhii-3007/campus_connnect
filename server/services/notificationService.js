import { getApps } from 'firebase-admin/app';
import { firebaseDb, getDatabase } from '../config/firebaseAdmin.js';
import User from '../models/User.js';

/**
 * Service to manage real-time notifications via Firebase Realtime Database.
 * Database structure:
 * notifications/
 *   firebaseUid/
 *     notificationId/
 *       title
 *       message
 *       eventId
 *       createdAt
 *       read
 */

/**
 * Dispatches real-time notifications to all registered student users when a new event is published.
 * Non-blocking: failures are logged cleanly and do not fail the event creation.
 *
 * @param {Object} event - The saved Mongoose Event document.
 */
export const notifyStudentsNewEvent = async (event) => {
  try {
    if (!getApps().length) {
      // Firebase Admin app is not configured (e.g. during offline test runs)
      return;
    }

    const db = firebaseDb || getDatabase();

    if (!db) {
      console.warn('Realtime Database is not initialized. Skipping real-time student notifications.');
      return;
    }

    // Retrieve all student users from MongoDB
    const students = await User.find({ role: 'student' }).select('firebaseUid name email');

    if (!students || students.length === 0) {
      console.log('No registered students found to notify.');
      return;
    }

    const eventDateFormatted = new Date(event.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const notificationPayload = {
      title: 'New Campus Event!',
      message: `"${event.title}" has been scheduled for ${eventDateFormatted} at ${event.venue}. Reserve your spot!`,
      eventId: event._id.toString(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    let dispatchedCount = 0;

    // Push notification to each student's personal notification queue
    const writePromises = students
      .filter((student) => Boolean(student.firebaseUid))
      .map(async (student) => {
        try {
          const userNotifRef = db.ref(`notifications/${student.firebaseUid}`).push();
          await userNotifRef.set({
            ...notificationPayload,
            id: userNotifRef.key,
          });
          dispatchedCount++;
        } catch (singleErr) {
          console.error(`Failed to push notification for student [${student.email}]:`, singleErr.message);
        }
      });

    await Promise.all(writePromises);
    console.log(`Dispatched real-time notifications to ${dispatchedCount} student(s) for event: "${event.title}".`);
  } catch (error) {
    // Log error safely without exposing credentials
    console.error('Notification dispatch error:', error.message);
  }
};

/**
 * Marks a specific notification as read in Firebase Realtime Database.
 * Ensures the notification belongs to the authenticated user's firebaseUid.
 *
 * @param {string} firebaseUid - The authenticated user's Firebase UID.
 * @param {string} notificationId - The ID of the notification to mark as read.
 */
export const markNotificationAsRead = async (firebaseUid, notificationId) => {
  if (!getApps().length) {
    throw new Error('Realtime Database service is not available (Firebase Admin not initialized).');
  }

  const db = firebaseDb || getDatabase();

  if (!db) {
    throw new Error('Realtime Database service is not available.');
  }

  const notifRef = db.ref(`notifications/${firebaseUid}/${notificationId}`);
  const snapshot = await notifRef.once('value');

  if (!snapshot.exists()) {
    return false; // Notification not found or does not belong to this user
  }

  await notifRef.update({ read: true });
  return true;
};
