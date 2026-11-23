import { markNotificationAsRead } from '../services/notificationService.js';

/**
 * PATCH /api/notifications/:id/read
 * Mark a user's notification as read.
 * Enforces that only the owner of the notification (via req.user.firebaseUid) can update it.
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { firebaseUid } = req.user;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID.',
      });
    }

    const success = await markNotificationAsRead(firebaseUid, id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notificationId: id,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification read status.',
      error: error.message,
    });
  }
};
