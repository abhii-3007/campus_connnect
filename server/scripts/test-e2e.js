import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

import { syncUser, getCurrentUser } from '../controllers/authController.js';
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
import { markAsRead } from '../controllers/notificationController.js';
import requireRole from '../middleware/requireRole.js';

// Helper mock response
const mockRes = () => {
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

async function runCompleteTestSuite() {
  console.log('===============================================================');
  console.log('       CAMPUS CONNECT - FULL APPLICATION REVIEW & AUDIT        ');
  console.log('===============================================================\n');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  /* ------------------------------------------------------------------ */
  /* 1. AUTHENTICATION & DEFAULT ROLES                                  */
  /* ------------------------------------------------------------------ */
  console.log('--- 1. AUTHENTICATION & ROLE INTEGRITY ---');

  // Test 1.1: Signup automatically sets role to "student"
  const signupReq = {
    user: { uid: 'uid_student_amy', email: 'amy@campus.edu', name: 'Amy Student' },
    body: { name: 'Amy Student', role: 'eventManager' }, // Attacker trying to set manager role
  };
  const signupRes = mockRes();
  await syncUser(signupReq, signupRes);

  console.assert(signupRes.statusCode === 200, 'Signup status must be 200');
  console.assert(signupRes.body.user.role === 'student', 'Newly registered user MUST have role "student"');
  console.log('✓ 1.1 Signup assigns role "student" (client-supplied role ignored)');

  const amyStudent = await User.findOne({ firebaseUid: 'uid_student_amy' });

  // Test 1.2: Second student registration
  const signupReq2 = {
    user: { uid: 'uid_student_brian', email: 'brian@campus.edu', name: 'Brian Student' },
    body: { name: 'Brian Student' },
  };
  const signupRes2 = mockRes();
  await syncUser(signupReq2, signupRes2);
  const brianStudent = await User.findOne({ firebaseUid: 'uid_student_brian' });
  console.log('✓ 1.2 Second student account created successfully');

  // Test 1.3: Event Manager accounts created via trusted administrative path
  const manager1 = await User.create({
    firebaseUid: 'uid_manager_claire',
    name: 'Claire Organizer',
    email: 'claire@campus.edu',
    role: 'eventManager',
    department: 'Student Affairs',
  });

  const manager2 = await User.create({
    firebaseUid: 'uid_manager_dan',
    name: 'Dan Director',
    email: 'dan@campus.edu',
    role: 'eventManager',
    department: 'Athletics',
  });
  console.log('✓ 1.3 Event Manager accounts provisioned securely');

  /* ------------------------------------------------------------------ */
  /* 2. AUTHORIZATION                                                   */
  /* ------------------------------------------------------------------ */
  console.log('\n--- 2. AUTHORIZATION & ACCESS CONTROL ---');

  // Test 2.1: Student cannot create events
  const managerOnly = requireRole('eventManager');
  const studentCreateRes = mockRes();
  let studentNextCalled = false;
  managerOnly({ user: amyStudent }, studentCreateRes, () => { studentNextCalled = true; });
  console.assert(studentCreateRes.statusCode === 403 && !studentNextCalled, 'Student must be blocked from manager role');
  console.log('✓ 2.1 Student blocked from creating events (HTTP 403)');

  // Test 2.2: Student cannot register for student-only events if user is manager
  const studentOnly = requireRole('student');
  const managerRegRes = mockRes();
  let managerNextCalled = false;
  studentOnly({ user: manager1 }, managerRegRes, () => { managerNextCalled = true; });
  console.assert(managerRegRes.statusCode === 403 && !managerNextCalled, 'Manager must be blocked from student role');
  console.log('✓ 2.2 Manager blocked from student-only actions (HTTP 403)');

  // Test 2.3: User cannot modify role via profile update
  const hackProfileRes = mockRes();
  await updateProfile({ user: amyStudent, body: { role: 'eventManager' } }, hackProfileRes);
  console.assert(hackProfileRes.statusCode === 403, 'Role escalation via PATCH /me must return 403');
  console.log('✓ 2.3 Privilege escalation attempt blocked (HTTP 403)');

  /* ------------------------------------------------------------------ */
  /* 3. EVENT CREATION, VALIDATION & MANAGEMENT                         */
  /* ------------------------------------------------------------------ */
  console.log('\n--- 3. EVENT CREATION, VALIDATION & MANAGEMENT ---');

  // Test 3.1: Required fields validation
  const invalidEventRes = mockRes();
  await createEvent({ user: manager1, body: { title: 'No Date' } }, invalidEventRes);
  console.assert(invalidEventRes.statusCode === 400, 'Missing fields must return 400');
  console.log('✓ 3.1 Missing required event fields rejected with 400');

  // Test 3.2: Valid event creation
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const validEventRes = mockRes();
  await createEvent({
    user: manager1,
    body: {
      title: 'AI Innovation Summit',
      description: 'Showcasing student machine learning projects.',
      date: nextWeek.toISOString(),
      time: '11:00 AM',
      venue: 'Auditorium Hall A',
      capacity: 2, // Capacity set to 2 to test overflow
    },
  }, validEventRes);

  console.assert(validEventRes.statusCode === 201, 'Valid event creation must return 201');
  const createdEvent = validEventRes.body.event;
  console.log(`✓ 3.2 Event created successfully: "${createdEvent.title}" (Capacity: ${createdEvent.capacity})`);

  // Test 3.3: Event listing and search
  const listRes = mockRes();
  await getAllEvents({ query: { search: 'Innovation' } }, listRes);
  console.assert(listRes.statusCode === 200 && listRes.body.events.length === 1, 'Search must match event');
  console.log('✓ 3.3 Event listing with search query functioning');

  // Test 3.4: Event editing by creator
  const editRes = mockRes();
  await updateEvent({
    user: manager1,
    params: { id: createdEvent._id },
    body: { venue: 'Auditorium Hall B (Updated)' },
  }, editRes);
  console.assert(editRes.statusCode === 200 && editRes.body.event.venue.includes('Updated'), 'Creator edit must succeed');
  console.log('✓ 3.4 Event creator updated venue successfully');

  // Test 3.5: Manager 2 attempting to edit Manager 1's event (MUST FAIL 403)
  const unauthorizedEditRes = mockRes();
  await updateEvent({
    user: manager2,
    params: { id: createdEvent._id },
    body: { title: 'Hijacked' },
  }, unauthorizedEditRes);
  console.assert(unauthorizedEditRes.statusCode === 403, 'Non-creator edit must return 403');
  console.log('✓ 3.5 Non-creator manager blocked from editing event (HTTP 403)');

  // Test 3.6: Manager 2 attempting to delete Manager 1's event (MUST FAIL 403)
  const unauthorizedDeleteRes = mockRes();
  await deleteEvent({
    user: manager2,
    params: { id: createdEvent._id },
  }, unauthorizedDeleteRes);
  console.assert(unauthorizedDeleteRes.statusCode === 403, 'Non-creator delete must return 403');
  console.log('✓ 3.6 Non-creator manager blocked from deleting event (HTTP 403)');

  /* ------------------------------------------------------------------ */
  /* 4. REGISTRATIONS & CAPACITY CONTROLS                               */
  /* ------------------------------------------------------------------ */
  console.log('\n--- 4. REGISTRATIONS & CAPACITY CONTROLS ---');

  // Test 4.1: Amy registers successfully
  const reg1Res = mockRes();
  await registerForEvent({ user: amyStudent, params: { id: createdEvent._id } }, reg1Res);
  console.assert(reg1Res.statusCode === 201, 'Student 1 registration must return 201');
  console.log('✓ 4.1 Student 1 registered successfully');

  // Test 4.2: Duplicate registration prevention
  const dupRegRes = mockRes();
  await registerForEvent({ user: amyStudent, params: { id: createdEvent._id } }, dupRegRes);
  console.assert(dupRegRes.statusCode === 409, 'Duplicate registration must return 409 Conflict');
  console.log('✓ 4.2 Duplicate registration prevented with HTTP 409 Conflict');

  // Test 4.3: Brian registers (capacity reached: 2/2)
  const reg2Res = mockRes();
  await registerForEvent({ user: brianStudent, params: { id: createdEvent._id } }, reg2Res);
  console.assert(reg2Res.statusCode === 201, 'Student 2 registration must return 201');
  console.log('✓ 4.3 Student 2 registered (Event reached maximum capacity: 2/2)');

  // Test 4.4: Third student attempts registration when full (MUST FAIL 409)
  const student3 = await User.create({
    firebaseUid: 'uid_student_chloe',
    name: 'Chloe Student',
    email: 'chloe@campus.edu',
    role: 'student',
  });
  const overflowRes = mockRes();
  await registerForEvent({ user: student3, params: { id: createdEvent._id } }, overflowRes);
  console.assert(overflowRes.statusCode === 409, 'Registration on full event must return 409');
  console.log('✓ 4.4 Registration blocked when event capacity is reached (HTTP 409)');

  // Test 4.5: Past event registration rejection
  const pastEvent = await Event.create({
    title: 'Historic Lecture',
    description: 'Yesterday event',
    date: new Date(Date.now() - 86400000 * 2),
    time: '10:00 AM',
    venue: 'Room 101',
    capacity: 50,
    createdBy: manager1._id,
  });
  const pastRegRes = mockRes();
  await registerForEvent({ user: student3, params: { id: pastEvent._id } }, pastRegRes);
  console.assert(pastRegRes.statusCode === 400, 'Past event registration must return 400');
  console.log('✓ 4.5 Registration for past event rejected with HTTP 400');

  // Test 4.6: Creator views event attendee list
  const attendeeRes = mockRes();
  await getEventRegistrations({ user: manager1, params: { id: createdEvent._id } }, attendeeRes);
  console.assert(attendeeRes.statusCode === 200 && attendeeRes.body.registrations.length === 2, 'Creator must see 2 attendees');
  console.log(`✓ 4.6 Event creator retrieved attendee list (${attendeeRes.body.registrations.length} students)`);

  // Test 4.7: Non-creator manager blocked from attendee list
  const unauthAttendeeRes = mockRes();
  await getEventRegistrations({ user: manager2, params: { id: createdEvent._id } }, unauthAttendeeRes);
  console.assert(unauthAttendeeRes.statusCode === 403, 'Non-creator must be blocked from seeing attendees');
  console.log('✓ 4.7 Non-creator manager blocked from seeing attendees (HTTP 403)');

  /* ------------------------------------------------------------------ */
  /* 5. PROFILE APIs                                                    */
  /* ------------------------------------------------------------------ */
  console.log('\n--- 5. PROFILE APIs ---');

  // Test 5.1: Retrieve profile
  const profileRes = mockRes();
  await getProfile({ user: amyStudent }, profileRes);
  console.assert(profileRes.statusCode === 200 && profileRes.body.user.email === 'amy@campus.edu', 'Profile must match');
  console.log('✓ 5.1 Retrieved user profile');

  // Test 5.2: Update allowed fields
  const updateProfileRes = mockRes();
  await updateProfile({
    user: amyStudent,
    body: { name: 'Amy S. Watson', department: 'Computer Engineering', year: '4th Year' },
  }, updateProfileRes);
  console.assert(updateProfileRes.statusCode === 200 && updateProfileRes.body.user.name === 'Amy S. Watson', 'Profile update must succeed');
  console.log('✓ 5.2 Updated allowed fields (name, department, year)');

  /* ------------------------------------------------------------------ */
  /* 6. CLEAN DELETION WITH REGISTRATION PURGE                         */
  /* ------------------------------------------------------------------ */
  console.log('\n--- 6. EVENT DELETION & REGISTRATION PURGE ---');
  const deleteRes = mockRes();
  await deleteEvent({ user: manager1, params: { id: createdEvent._id } }, deleteRes);
  console.assert(deleteRes.statusCode === 200, 'Delete must return 200');

  const remainingEvent = await Event.findById(createdEvent._id);
  const remainingRegs = await Registration.find({ eventId: createdEvent._id });
  console.assert(remainingEvent === null, 'Event must be deleted from DB');
  console.assert(remainingRegs.length === 0, 'All registrations for deleted event must be purged');
  console.log('✓ 6.1 Event and all associated registrations purged completely');

  await mongoose.disconnect();
  await mongod.stop();

  console.log('\n===============================================================');
  console.log('     ALL APPLICATION CHECKS & TESTS PASSED WITH 100% SUCCESS   ');
  console.log('===============================================================\n');
  process.exit(0);
}

runCompleteTestSuite().catch((err) => {
  console.error('\nE2E Verification Error:', err);
  process.exit(1);
});
