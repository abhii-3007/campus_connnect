import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

/**
 * Safe CLI promotion script.
 * Usage:
 *   node scripts/makeManager.js <user-email>
 *   npm run make-manager <user-email>
 */
const promoteToManager = async () => {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Error: Please provide a registered user email address.');
    console.log('Usage: npm run make-manager <user-email>');
    console.log('Example: npm run make-manager manager@campus.edu');
    process.exit(1);
  }

  try {
    // Connect to database
    await connectDB();

    // Look up user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`Failure: No registered user found with email "${email}".`);
      console.error('The user must first sign up via Campus Connect before being promoted.');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (user.role === 'eventManager') {
      console.log(`Notice: User "${user.name}" (${user.email}) already has the "eventManager" role.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update role
    const previousRole = user.role;
    user.role = 'eventManager';
    await user.save();

    console.log('----------------------------------------------------');
    console.log('SUCCESS: User role successfully updated!');
    console.log(`Name:          ${user.name}`);
    console.log(`Email:         ${user.email}`);
    console.log(`Previous Role: ${previousRole}`);
    console.log(`New Role:      ${user.role}`);
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failure: An unexpected error occurred while updating role:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

promoteToManager();
