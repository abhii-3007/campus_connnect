import User from '../models/User.js';

/**
 * GET /api/users/me
 * Return the logged-in user's profile.
 */
export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/users/me
 * Update name, department and year.
 * Disallows updating role, email, firebaseUid or _id.
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, department, year, role, firebaseUid, email, _id } = req.body;

    // Explicitly reject or ignore attempts to escalate role or change unique keys
    if (role !== undefined && role !== req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Modifying account role is strictly prohibited.',
      });
    }

    if (firebaseUid !== undefined && firebaseUid !== req.user.firebaseUid) {
      return res.status(403).json({
        success: false,
        message: 'Modifying Firebase UID is strictly prohibited.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Input validation
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty.',
        });
      }
      user.name = name.trim();
    }

    if (department !== undefined) {
      user.department = typeof department === 'string' ? department.trim() : '';
    }

    if (year !== undefined) {
      user.year = typeof year === 'string' ? year.trim() : '';
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user profile.',
      error: error.message,
    });
  }
};
