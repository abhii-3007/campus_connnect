import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../models/User.js';
import requireRole from '../middleware/requireRole.js';

async function testRoleAuthorization() {
  console.log('--- Testing Role-Based Authorization & Promotion ---');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Helper mock response
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

  // 1. Create a student user in MongoDB
  const studentUser = await User.create({
    firebaseUid: 'test_student_uid',
    name: 'Alice Student',
    email: 'alice@campus.edu',
    role: 'student',
  });
  console.log('Created student user:', studentUser.email, 'Role:', studentUser.role);

  // 2. Test requireRole('eventManager') on student (MUST reject with 403)
  console.log('Test 1: Student attempting to access Event Manager route...');
  const managerOnly = requireRole('eventManager');
  const reqStudent = { user: studentUser };
  const resStudent = createMockRes();
  let studentNextCalled = false;

  managerOnly(reqStudent, resStudent, () => {
    studentNextCalled = true;
  });

  if (resStudent.statusCode === 403 && !studentNextCalled) {
    console.log('✓ PASS: Student was blocked with HTTP 403 Forbidden.');
  } else {
    throw new Error(`FAIL: Student was not properly rejected. Status: ${resStudent.statusCode}`);
  }

  // 3. Test requireRole('student') on student (MUST succeed)
  console.log('Test 2: Student accessing Student-only route...');
  const studentOnly = requireRole('student');
  const resStudent2 = createMockRes();
  let studentAllowed = false;

  studentOnly(reqStudent, resStudent2, () => {
    studentAllowed = true;
  });

  if (studentAllowed) {
    console.log('✓ PASS: Student was allowed to access student route.');
  } else {
    throw new Error('FAIL: Student was denied student route.');
  }

  // 4. Test promotion to eventManager
  console.log('Test 3: Promoting student to eventManager...');
  studentUser.role = 'eventManager';
  await studentUser.save();

  const updatedUser = await User.findOne({ email: 'alice@campus.edu' });
  if (updatedUser.role !== 'eventManager') {
    throw new Error('FAIL: User role was not updated to eventManager.');
  }
  console.log('✓ PASS: User role is now "eventManager".');

  // 5. Test promoted user accessing eventManager route (MUST succeed)
  console.log('Test 4: Promoted manager accessing Event Manager route...');
  const reqManager = { user: updatedUser };
  const resManager = createMockRes();
  let managerAllowed = false;

  managerOnly(reqManager, resManager, () => {
    managerAllowed = true;
  });

  if (managerAllowed) {
    console.log('✓ PASS: Event Manager was allowed access to manager route.');
  } else {
    throw new Error('FAIL: Event Manager was denied access to manager route.');
  }

  // 6. Test manager accessing student-only registration route (MUST reject with 403)
  console.log('Test 5: Event Manager attempting to register as student...');
  const resManager2 = createMockRes();
  let managerRegistered = false;

  studentOnly(reqManager, resManager2, () => {
    managerRegistered = true;
  });

  if (resManager2.statusCode === 403 && !managerRegistered) {
    console.log('✓ PASS: Event Manager was blocked from student registration route with HTTP 403.');
  } else {
    throw new Error(`FAIL: Event Manager was not blocked from student registration. Status: ${resManager2.statusCode}`);
  }

  await mongoose.disconnect();
  await mongod.stop();
  console.log('--- All Role Authorization Tests Passed Successfully! ---');
  process.exit(0);
}

testRoleAuthorization().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
