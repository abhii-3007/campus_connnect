import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

import { getProfile, updateProfile } from '../controllers/userController.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
} from '../controllers/registrationController.js';

// Helper mock response
const createMockRes = () => {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
};

async function runTestSuite() {
  console.log('=== STARTING REST API COMPREHENSIVE VERIFICATION ===\n');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Seed Users
  const student1 = await User.create({
    firebaseUid: 'fb_student_1',
    name: 'Emma Student',
    email: 'emma@campus.edu',
    role: 'student',
    department: 'Biology',
    year: '2nd Year',
  });

  const student2 = await User.create({
    firebaseUid: 'fb_student_2',
    name: 'Lucas Student',
    email: 'lucas@campus.edu',
    role: 'student',
    department: 'Mathematics',
    year: '1st Year',
  });

  const manager1 = await User.create({
    firebaseUid: 'fb_manager_1',
    name: 'Dr. Evelyn Manager',
    email: 'evelyn@campus.edu',
    role: 'eventManager',
    department: 'Student Affairs',
    year: 'Faculty',
  });

  const manager2 = await User.create({
    firebaseUid: 'fb_manager_2',
    name: 'Prof. David Manager',
    email: 'david@campus.edu',
    role: 'eventManager',
    department: 'Engineering',
    year: 'Faculty',
  });

  console.log('✓ Seeded test users (2 students, 2 event managers)\n');

  // 1. Test GET /api/users/me
  {
    console.log('[TEST 1] GET /api/users/me');
    const req = { user: student1 };
    const res = createMockRes();
    await getProfile(req, res);

    if (res.statusCode !== 200 || res.body.user.email !== 'emma@campus.edu') {
      throw new Error(`Test 1 Failed: Status ${res.statusCode}`);
    }
    console.log('  -> Status 200: Successfully retrieved profile.');
  }

  // 2. Test PATCH /api/users/me
  {
    console.log('[TEST 2] PATCH /api/users/me');
    // 2a: Valid update
    const req = {
      user: student1,
      body: { name: 'Emma Watson', department: 'Biotechnology' },
    };
    const res = createMockRes();
    await updateProfile(req, res);

    if (res.statusCode !== 200 || res.body.user.name !== 'Emma Watson') {
      throw new Error(`Test 2a Failed: Status ${res.statusCode}`);
    }
    console.log('  -> Status 200: Successfully updated name and department.');

    // 2b: Unauthorized role mutation attempt
    const reqHack = {
      user: student1,
      body: { role: 'eventManager' },
    };
    const resHack = createMockRes();
    await updateProfile(reqHack, resHack);

    if (resHack.statusCode !== 403) {
      throw new Error(`Test 2b Failed: Expected 403, got ${resHack.statusCode}`);
    }
    console.log('  -> Status 403: Blocked role escalation attempt.');

    // 2c: Empty name validation
    const reqBadName = {
      user: student1,
      body: { name: '   ' },
    };
    const resBadName = createMockRes();
    await updateProfile(reqBadName, resBadName);

    if (resBadName.statusCode !== 400) {
      throw new Error(`Test 2c Failed: Expected 400, got ${resBadName.statusCode}`);
    }
    console.log('  -> Status 400: Rejected empty name input.');
  }

  // 3. Test POST /api/events
  let createdEvent = null;
  {
    console.log('\n[TEST 3] POST /api/events');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);

    // 3a: Valid event creation
    const req = {
      user: manager1,
      body: {
        title: 'Tech Symposium 2026',
        description: 'Annual gathering of tech minds.',
        date: tomorrow.toISOString(),
        time: '10:00 AM',
        venue: 'Auditorium Hall 1',
        capacity: 2, // low capacity to test capacity limit later!
      },
    };
    const res = createMockRes();
    await createEvent(req, res);

    if (res.statusCode !== 201 || !res.body.event._id) {
      throw new Error(`Test 3a Failed: Status ${res.statusCode}`);
    }
    createdEvent = res.body.event;
    console.log('  -> Status 201: Event created successfully by eventManager.');

    // 3b: Validation error on missing fields
    const reqBad = {
      user: manager1,
      body: { title: 'Incomplete' },
    };
    const resBad = createMockRes();
    await createEvent(reqBad, resBad);

    if (resBad.statusCode !== 400) {
      throw new Error(`Test 3b Failed: Expected 400, got ${resBad.statusCode}`);
    }
    console.log('  -> Status 400: Missing required fields properly rejected.');
  }

  // 4. Test GET /api/events & GET /api/events/:id
  {
    console.log('\n[TEST 4] GET /api/events and GET /api/events/:id');
    // List all
    const reqList = { query: {} };
    const resList = createMockRes();
    await getAllEvents(reqList, resList);

    if (resList.statusCode !== 200 || resList.body.events.length !== 1) {
      throw new Error(`Test 4a Failed: Status ${resList.statusCode}`);
    }
    console.log('  -> Status 200: Listed all events.');

    // Search query
    const reqSearch = { query: { search: 'Symposium' } };
    const resSearch = createMockRes();
    await getAllEvents(reqSearch, resSearch);

    if (resSearch.statusCode !== 200 || resSearch.body.count !== 1) {
      throw new Error(`Test 4b Failed: Search did not find event`);
    }
    console.log('  -> Status 200: Search filtering works.');

    // Get specific event
    const reqGet = { params: { id: createdEvent._id } };
    const resGet = createMockRes();
    await getEventById(reqGet, resGet);

    if (resGet.statusCode !== 200 || resGet.body.event.title !== 'Tech Symposium 2026') {
      throw new Error(`Test 4c Failed: Status ${resGet.statusCode}`);
    }
    console.log('  -> Status 200: Single event retrieval by ID works.');

    // Non-existent ID
    const reqNotFound = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const resNotFound = createMockRes();
    await getEventById(reqNotFound, resNotFound);

    if (resNotFound.statusCode !== 404) {
      throw new Error(`Test 4d Failed: Expected 404, got ${resNotFound.statusCode}`);
    }
    console.log('  -> Status 404: Non-existent event returns 404.');
  }

  // 5. Test PATCH /api/events/:id
  {
    console.log('\n[TEST 5] PATCH /api/events/:id');
    // 5a: Forbidden when updated by another manager
    const reqOther = {
      user: manager2, // Not creator!
      params: { id: createdEvent._id },
      body: { title: 'Hijacked Title' },
    };
    const resOther = createMockRes();
    await updateEvent(reqOther, resOther);

    if (resOther.statusCode !== 403) {
      throw new Error(`Test 5a Failed: Expected 403, got ${resOther.statusCode}`);
    }
    console.log('  -> Status 403: Blocked non-creator manager from modifying event.');

    // 5b: Success when updated by creator
    const reqCreator = {
      user: manager1,
      params: { id: createdEvent._id },
      body: { venue: 'Auditorium Hall 2 (Updated)' },
    };
    const resCreator = createMockRes();
    await updateEvent(reqCreator, resCreator);

    if (resCreator.statusCode !== 200 || resCreator.body.event.venue !== 'Auditorium Hall 2 (Updated)') {
      throw new Error(`Test 5b Failed: Status ${resCreator.statusCode}`);
    }
    console.log('  -> Status 200: Creator successfully updated event venue.');
  }

  // 6. Test POST /api/events/:id/register
  {
    console.log('\n[TEST 6] POST /api/events/:id/register');

    // 6a: Successful registration by Student 1
    const reqReg1 = {
      user: student1,
      params: { id: createdEvent._id },
    };
    const resReg1 = createMockRes();
    await registerForEvent(reqReg1, resReg1);

    if (resReg1.statusCode !== 201) {
      throw new Error(`Test 6a Failed: Expected 201, got ${resReg1.statusCode}`);
    }
    console.log('  -> Status 201: Student 1 successfully registered.');

    // 6b: Duplicate registration attempt (409 Conflict)
    const resRegDuplicate = createMockRes();
    await registerForEvent(reqReg1, resRegDuplicate);

    if (resRegDuplicate.statusCode !== 409) {
      throw new Error(`Test 6b Failed: Expected 409, got ${resRegDuplicate.statusCode}`);
    }
    console.log('  -> Status 409: Duplicate registration rejected.');

    // 6c: Student 2 registers (fills the event: capacity is 2)
    const reqReg2 = {
      user: student2,
      params: { id: createdEvent._id },
    };
    const resReg2 = createMockRes();
    await registerForEvent(reqReg2, resReg2);

    if (resReg2.statusCode !== 201) {
      throw new Error(`Test 6c Failed: Expected 201, got ${resReg2.statusCode}`);
    }
    console.log('  -> Status 201: Student 2 registered (event reached capacity of 2).');

    // 6d: Student 3 registers when full (409 Conflict)
    const student3 = await User.create({
      firebaseUid: 'fb_student_3',
      name: 'Bob Student',
      email: 'bob@campus.edu',
      role: 'student',
    });
    const reqReg3 = {
      user: student3,
      params: { id: createdEvent._id },
    };
    const resReg3 = createMockRes();
    await registerForEvent(reqReg3, resReg3);

    if (resReg3.statusCode !== 409) {
      throw new Error(`Test 6d Failed: Expected 409 for full event, got ${resReg3.statusCode}`);
    }
    console.log('  -> Status 409: Full capacity registration properly rejected.');

    // 6e: Register for past event rejected (400 Bad Request)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastEvent = await Event.create({
      title: 'Past Workshop',
      description: 'Already finished event',
      date: pastDate,
      time: '09:00 AM',
      venue: 'Old Hall',
      capacity: 50,
      createdBy: manager1._id,
    });
    const reqPast = {
      user: student3,
      params: { id: pastEvent._id },
    };
    const resPast = createMockRes();
    await registerForEvent(reqPast, resPast);

    if (resPast.statusCode !== 400) {
      throw new Error(`Test 6e Failed: Expected 400 for past event, got ${resPast.statusCode}`);
    }
    console.log('  -> Status 400: Past event registration properly rejected.');
  }

  // 7. Test GET /api/registrations/me
  {
    console.log('\n[TEST 7] GET /api/registrations/me');
    const req = { user: student1 };
    const res = createMockRes();
    await getMyRegistrations(req, res);

    if (res.statusCode !== 200 || res.body.count !== 1) {
      throw new Error(`Test 7 Failed: Expected 1 registration, got ${res.body.count}`);
    }
    console.log('  -> Status 200: Successfully returned student’s registered events.');
  }

  // 8. Test GET /api/events/:id/registrations
  {
    console.log('\n[TEST 8] GET /api/events/:id/registrations');
    // 8a: Creator manager accesses registrations
    const reqCreator = {
      user: manager1,
      params: { id: createdEvent._id },
    };
    const resCreator = createMockRes();
    await getEventRegistrations(reqCreator, resCreator);

    if (resCreator.statusCode !== 200 || resCreator.body.registrations.length !== 2) {
      throw new Error(`Test 8a Failed: Expected 2 registered students, got ${resCreator.body.registrations?.length}`);
    }
    console.log('  -> Status 200: Event creator retrieved 2 registered students.');

    // 8b: Non-creator manager blocked (403)
    const reqOther = {
      user: manager2,
      params: { id: createdEvent._id },
    };
    const resOther = createMockRes();
    await getEventRegistrations(reqOther, resOther);

    if (resOther.statusCode !== 403) {
      throw new Error(`Test 8b Failed: Expected 403, got ${resOther.statusCode}`);
    }
    console.log('  -> Status 403: Non-creator manager blocked from seeing registrations.');
  }

  // 9. Test DELETE /api/events/:id
  {
    console.log('\n[TEST 9] DELETE /api/events/:id');
    // 9a: Non-creator blocked (403)
    const reqOther = {
      user: manager2,
      params: { id: createdEvent._id },
    };
    const resOther = createMockRes();
    await deleteEvent(reqOther, resOther);

    if (resOther.statusCode !== 403) {
      throw new Error(`Test 9a Failed: Expected 403, got ${resOther.statusCode}`);
    }
    console.log('  -> Status 403: Non-creator manager blocked from deleting event.');

    // 9b: Creator deletes event and associated registrations
    const reqCreator = {
      user: manager1,
      params: { id: createdEvent._id },
    };
    const resCreator = createMockRes();
    await deleteEvent(reqCreator, resCreator);

    if (resCreator.statusCode !== 200 || resCreator.body.details.registrationsRemoved !== 2) {
      throw new Error(`Test 9b Failed: Status ${resCreator.statusCode}`);
    }
    console.log('  -> Status 200: Creator deleted event and cleaned up 2 registrations.');

    // Verify deletion in database
    const dbEvent = await Event.findById(createdEvent._id);
    const dbRegs = await Registration.find({ eventId: createdEvent._id });
    if (dbEvent !== null || dbRegs.length !== 0) {
      throw new Error('Test 9c Failed: Event or registrations still exist in DB.');
    }
    console.log('  -> Verified database: Event and registrations completely purged.');
  }

  await mongoose.disconnect();
  await mongod.stop();
  console.log('\n=== ALL REST API ENDPOINTS & STATUS CODES VERIFIED SUCCESSFULLY ===');
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('\nAPI Verification Error:', err);
  process.exit(1);
});
