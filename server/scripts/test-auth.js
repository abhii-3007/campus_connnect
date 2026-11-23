import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { syncUser } from '../controllers/authController.js';

async function testAuthSync() {
  console.log('--- Testing Auth Sync & Role Protection ---');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Mock response helper
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  // Test 1: New user registration gets default 'student' role
  console.log('Test 1: New registration assigns default "student" role...');
  const req1 = {
    user: {
      uid: 'firebase_test_uid_1',
      email: 'john.student@campus.edu',
      name: 'John Student',
    },
    body: {
      name: 'John Student',
      department: 'Computer Science',
      year: '2nd Year',
      // Attacking frontend attempting to grant itself eventManager role:
      role: 'eventManager',
    },
  };
  const res1 = createMockRes();
  await syncUser(req1, res1);

  if (res1.jsonData.user.role !== 'student') {
    throw new Error(`FAIL: Expected role 'student', got: ${res1.jsonData.user.role}`);
  }
  console.log('✓ PASS: Role was strictly set to "student", ignoring client-supplied role.');

  // Test 2: Existing user cannot have role changed via sync
  console.log('Test 2: Ensure repeated sync preserves existing role and user document...');
  const req2 = {
    user: {
      uid: 'firebase_test_uid_1',
      email: 'john.student@campus.edu',
    },
    body: {
      name: 'John Student Updated',
      role: 'eventManager', // Malicious attempt to escalate privileges
    },
  };
  const res2 = createMockRes();
  await syncUser(req2, res2);

  const dbUser = await User.findOne({ firebaseUid: 'firebase_test_uid_1' });
  if (dbUser.role !== 'student') {
    throw new Error(`FAIL: Role was tampered with! Got: ${dbUser.role}`);
  }
  if (dbUser.name !== 'John Student Updated') {
    throw new Error(`FAIL: Name update was not saved. Got: ${dbUser.name}`);
  }
  console.log('✓ PASS: Existing user role preserved as "student" during profile sync.');

  await mongoose.disconnect();
  await mongod.stop();
  console.log('--- All Auth & Role Security Tests Passed! ---');
  process.exit(0);
}

testAuthSync().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
