// Temporary sample data for Campus Connect UI demonstration.
// This file will be replaced by backend API integration in later phases.

export const SAMPLE_USERS = {
  student: {
    id: 'user_student_1',
    name: 'Alex Johnson',
    email: 'alex.johnson@campus.edu',
    role: 'student',
    department: 'Computer Science',
    year: '3rd Year',
  },
  manager: {
    id: 'user_manager_1',
    name: 'Sarah Miller',
    email: 'sarah.miller@campus.edu',
    role: 'event_manager',
    department: 'Student Affairs',
    year: 'Staff Coordinator',
  },
};

export const INITIAL_EVENTS = [
  {
    id: 'evt-1',
    title: 'Annual Campus Hackathon 2026',
    description: 'A 24-hour coding marathon to solve real-world campus problems. Food, mentorship, and prizes will be provided.',
    date: '2026-12-05',
    time: '10:00 AM',
    venue: 'Main Auditorium, Tech Block',
    maxParticipants: 120,
    registeredCount: 84,
    createdBy: 'user_manager_1',
  },
  {
    id: 'evt-2',
    title: 'Career & Internship Fair',
    description: 'Connect with top tech and finance recruiters. Bring your resume and dress in business casual attire.',
    date: '2026-12-10',
    time: '01:30 PM',
    venue: 'Student Activity Hall B',
    maxParticipants: 200,
    registeredCount: 165,
    createdBy: 'user_manager_1',
  },
  {
    id: 'evt-3',
    title: 'AI & Web3 Workshop',
    description: 'Hands-on session on building decentralized apps with modern AI tools. Open to all engineering students.',
    date: '2026-12-14',
    time: '03:00 PM',
    venue: 'Lab 402, CS Department',
    maxParticipants: 50,
    registeredCount: 32,
    createdBy: 'user_manager_1',
  },
  {
    id: 'evt-4',
    title: 'Campus Chess Championship',
    description: 'Rapid and blitz chess tournament with university ratings. Winner represents the college in inter-collegiate matches.',
    date: '2026-12-18',
    time: '11:00 AM',
    venue: 'Sports Complex Indoor Court',
    maxParticipants: 64,
    registeredCount: 64,
    createdBy: 'user_manager_2',
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    message: 'Your registration for "Annual Campus Hackathon 2026" is confirmed.',
    time: '10 minutes ago',
    read: false,
  },
  {
    id: 'notif-2',
    message: 'New event added: "Career & Internship Fair". Reserve your spot soon.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 'notif-3',
    message: 'Venue for "AI & Web3 Workshop" moved to Lab 402.',
    time: '1 day ago',
    read: true,
  },
];
