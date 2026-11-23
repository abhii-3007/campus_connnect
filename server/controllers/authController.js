import User from '../models/User.js';

/**
 * Sync authenticated Firebase user with MongoDB.
 * Creates a new user record if not present, assigning 'student' role by default.
 * Never trusts a client-supplied role.
 */
export const syncUser = async (req, res) => {
  try {
    const { uid, email, name: tokenName } = req.user;
    const { name: bodyName, department, year } = req.body;

    // Use name from body or token, or fallback to email prefix
    const finalName = bodyName || tokenName || (email ? email.split('@')[0] : 'Campus Member');

    // Check if user already exists in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Create new user - MUST default to 'student' role
      user = await User.create({
        firebaseUid: uid,
        name: finalName,
        email: email,
        role: 'student', // Enforced on backend - ignores any role sent by frontend
        department: department || '',
        year: year || '',
      });
      console.log(`New user registered in MongoDB: ${user.email} with role: ${user.role}`);
    } else {
      // If user already exists, update optional profile info if provided (never update role here)
      let needsUpdate = false;
      if (bodyName && user.name !== bodyName) {
        user.name = bodyName;
        needsUpdate = true;
      }
      if (department !== undefined && user.department !== department) {
        user.department = department;
        needsUpdate = true;
      }
      if (year !== undefined && user.year !== year) {
        user.year = year;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'User synchronized successfully',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while synchronizing user profile',
      error: error.message,
    });
  }
};

/**
 * Get current logged-in user profile from MongoDB.
 */
export const getCurrentUser = async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found in MongoDB.',
      });
    }

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
      },
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
      error: error.message,
    });
  }
};
