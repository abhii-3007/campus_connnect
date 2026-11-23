import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';

// In-memory mock for Firebase Realtime Database to test live dispatch & multi-client listeners
class MockRealtimeDatabase {
  constructor() {
    this.data = {};
    this.listeners = {};
  }

  ref(path) {
    const parts = path.split('/').filter(Boolean);
    const self = this;

    return {
      push() {
        const generatedKey = 'notif_' + Math.random().toString(36).substring(2, 9);
        const childPath = `${path}/${generatedKey}`;
        return {
          key: generatedKey,
          async set(val) {
            let curr = self.data;
            for (let i = 0; i < parts.length; i++) {
              curr[parts[i]] = curr[parts[i]] || {};
              curr = curr[parts[i]];
            }
            curr[generatedKey] = val;
            self._notify(path);
          },
        };
      },
      async once(event) {
        let curr = self.data;
        for (const part of parts) {
          if (!curr || typeof curr !== 'object') {
            curr = undefined;
            break;
          }
          curr = curr[part];
        }
        return {
          exists: () => curr !== undefined,
          val: () => curr,
        };
      },
      async update(val) {
        let curr = self.data;
        for (const part of parts) {
          curr = curr[part];
        }
        Object.assign(curr, val);
        self._notify(path);
      },
      on(event, callback) {
        self.listeners[path] = self.listeners[path] || [];
        self.listeners[path].push(callback);
        // Initial invoke
        this.once('value').then(callback);
      },
    };
  }

  _notify(path) {
    for (const [listenPath, callbacks] of Object.entries(this.listeners)) {
      if (path.startsWith(listenPath)) {
        this.ref(listenPath).once('value').then((snap) => {
          callbacks.forEach((cb) => cb(snap));
        });
      }
    }
  }
}

async function testRealtimeNotificationFlow() {
  console.log('=== REAL-TIME NOTIFICATIONS FLOW TEST ===\n');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // 1. Create 2 student accounts and 1 event manager in MongoDB
  const student1 = await User.create({
    firebaseUid: 'fb_student_alice',
    name: 'Alice Student',
    email: 'alice@campus.edu',
    role: 'student',
  });

  const student2 = await User.create({
    firebaseUid: 'fb_student_bob',
    name: 'Bob Student',
    email: 'bob@campus.edu',
    role: 'student',
  });

  const manager = await User.create({
    firebaseUid: 'fb_manager_carol',
    name: 'Carol Manager',
    email: 'carol@campus.edu',
    role: 'eventManager',
  });

  console.log('✓ Created 2 students (Alice, Bob) and 1 Event Manager (Carol)');

  // 2. Set up mock Realtime Database
  const mockDb = new MockRealtimeDatabase();

  // 3. Students attach their client listeners (simulating NotificationPanel onValue)
  let aliceNotifications = [];
  let bobNotifications = [];

  mockDb.ref(`notifications/${student1.firebaseUid}`).on('value', (snapshot) => {
    aliceNotifications = snapshot.val() ? Object.values(snapshot.val()) : [];
  });

  mockDb.ref(`notifications/${student2.firebaseUid}`).on('value', (snapshot) => {
    bobNotifications = snapshot.val() ? Object.values(snapshot.val()) : [];
  });

  console.log('✓ Attached real-time listeners for Alice and Bob');
  console.log('  Alice initial notifications:', aliceNotifications.length);
  console.log('  Bob initial notifications:', bobNotifications.length);

  // 4. Manager creates an event in MongoDB
  console.log('\n[Action] Carol creates a new campus event...');
  const newEvent = await Event.create({
    title: 'Spring Robotics Showcase',
    description: 'Demonstration of autonomous robots build by engineering clubs.',
    date: new Date(Date.now() + 86400000 * 5),
    time: '02:00 PM',
    venue: 'Innovation Center',
    capacity: 100,
    createdBy: manager._id,
  });

  // 5. Backend notification service simulates dispatch using the mock DB
  const students = await User.find({ role: 'student' });
  for (const s of students) {
    const notifRef = mockDb.ref(`notifications/${s.firebaseUid}`).push();
    await notifRef.set({
      id: notifRef.key,
      title: 'New Campus Event!',
      message: `"${newEvent.title}" has been scheduled for ${newEvent.venue}.`,
      eventId: newEvent._id.toString(),
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  // Allow event loop cycle for real-time listener callback
  await new Promise((resolve) => setTimeout(resolve, 50));

  console.log('\n[Real-time verification without page refresh]');
  console.log(`✓ Alice received notification: "${aliceNotifications[0]?.title}" - Unread: ${!aliceNotifications[0]?.read}`);
  console.log(`✓ Bob received notification:   "${bobNotifications[0]?.title}" - Unread: ${!bobNotifications[0]?.read}`);

  if (aliceNotifications.length !== 1 || bobNotifications.length !== 1) {
    throw new Error('FAIL: Both students did not receive real-time notifications');
  }

  if (aliceNotifications[0].read !== false) {
    throw new Error('FAIL: Notification read status must initially be false');
  }

  // 6. Test Alice marks her notification as read
  console.log('\n[Action] Alice marks her notification as read...');
  const aliceNotifId = aliceNotifications[0].id;
  await mockDb.ref(`notifications/${student1.firebaseUid}/${aliceNotifId}`).update({ read: true });

  await new Promise((resolve) => setTimeout(resolve, 50));

  console.log(`✓ Alice notification read status is now: ${aliceNotifications[0].read}`);
  console.log(`✓ Bob notification read status remains:  ${bobNotifications[0].read}`);

  if (!aliceNotifications[0].read || bobNotifications[0].read) {
    throw new Error('FAIL: Alice mark as read did not properly update or leaked to Bob');
  }

  await mongoose.disconnect();
  await mongod.stop();
  console.log('\n=== REAL-TIME NOTIFICATION FLOW VERIFIED SUCCESSFULLY ===');
  process.exit(0);
}

testRealtimeNotificationFlow().catch((err) => {
  console.error('Notification test failed:', err);
  process.exit(1);
});
