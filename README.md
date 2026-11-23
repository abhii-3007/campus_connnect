# Campus Connect 🎓

Campus Connect is a full-stack campus event and peer networking platform built to streamline discovering, managing, and registering for college events with real-time updates.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Features](#3-features)
4. [User Roles](#4-user-roles)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Folder Structure](#7-folder-structure)
8. [MongoDB Models and Relationships](#8-mongodb-models-and-relationships)
9. [Firebase Authentication Setup](#9-firebase-authentication-setup)
10. [Firebase Realtime Database Notification Setup](#10-firebase-realtime-database-notification-setup)
11. [Environment Variable Setup](#11-environment-variable-setup)
12. [Installation Commands](#12-installation-commands)
13. [Commands to Run Frontend and Backend](#13-commands-to-run-frontend-and-backend)
14. [API Endpoint Documentation](#14-api-endpoint-documentation)
15. [How to Create a Student Account](#15-how-to-create-a-student-account)
16. [How to Create an Event Manager Account](#16-how-to-create-an-event-manager-account)
17. [How to Test Event Creation and Registration](#17-how-to-test-event-creation-and-registration)
18. [Known Limitations and Future Improvements](#18-known-limitations-and-future-improvements)

---

## 1. Project Overview

Campus Connect connects college students and campus event organizers into a single platform. Students can browse upcoming campus events, view real-time capacity and details, reserve a spot, and receive instant notifications when new events are published. Event managers can publish and manage events, track attendance lists in real time, and adjust capacities.

---

## 2. Problem Statement

On university campuses, event announcements are often scattered across message boards, noticeboards, informal chat groups, and physical flyers. This creates several problems:
- **Missed Opportunities:** Students often find out about workshops, hackathons, or career fairs after registrations have closed.
- **Overbooking & Lack of Controls:** Organizers struggle with event capacity, duplicate signups, and manual attendee spreadsheets.
- **Disconnected Notifications:** There is rarely a unified channel for students to receive immediate, centralized updates about campus activities.

Campus Connect solves these challenges by providing a centralized web platform with secure role-based access, real-time push notifications, and server-enforced capacity and duplicate checks.

---

## 3. Features

- **Email & Password Authentication:** Powered by Firebase Authentication with session restoration on page refresh.
- **Database User Profiles:** Synchronized in MongoDB, keeping user profiles (`name`, `department`, `year`) securely bound to their Firebase identity.
- **Role-Based Authorization:** Strict server-enforced role separation (`student` and `eventManager`). Roles cannot be manipulated from the frontend.
- **Campus Event Management:** Event Managers can create, update, and delete campus events, including date, time, venue, description, and participant capacity.
- **Event Discovery & Filtering:** Students can search events by title and filter between "All Events" and "My Registered Events".
- **Guaranteed Registration Integrity:**
  - Past events cannot be registered for.
  - Compound database unique indexes prevent duplicate registrations.
  - Registration automatically closes when maximum capacity is reached.
- **Live Event Attendees:** Event Managers can view real-time attendee lists for their own events.
- **Real-Time Push Notifications:** Powered by Firebase Realtime Database. As soon as an organizer publishes an event, every registered student receives a live notification alert without page refresh.
- **Notification Read Status:** Students can mark notifications as read, updating their unread counter.
- **Profile Management:** Users can view and update their name, department, and year of study while keeping roles and emails tamper-proof.

---

## 4. User Roles

| Role | Default For | Permissions |
|---|---|---|
| **Student** (`student`) | All new registrations | - Browse all campus events and search by title<br>- Register for upcoming open events<br>- View registration history and details<br>- Receive real-time event notifications<br>- Update personal profile (department, year) |
| **Event Manager** (`eventManager`) | Assigned via backend CLI | - Publish new campus events<br>- Edit and delete their own events<br>- View registered attendee lists for their events<br>- Update personal profile |

> **Security Rule:** Newly registered users are assigned the `student` role by default. The `eventManager` role can only be granted through a trusted backend operation (`npm run make-manager`). Any role parameter sent by a client during registration or profile updates is strictly ignored.

---

## 5. Technology Stack

- **Frontend:**
  - React.js 19 (functional components and hooks)
  - Vite (build tool and dev server)
  - React Router DOM v7 (client-side routing)
  - Tailwind CSS v4 (minimal, responsive styling)
  - Firebase Web SDK (Auth & Realtime Database)
  - Plain `fetch` (no Axios, Redux, or heavy UI frameworks)
- **Backend:**
  - Node.js (ES modules: `"type": "module"`)
  - Express.js (REST API framework)
  - Mongoose & MongoDB (database and data modeling)
  - Firebase Admin SDK (token verification and server-side Realtime Database writes)
  - `cors` and `dotenv`

---

## 6. System Architecture

```mermaid
flowchart TD
    Client["React Frontend (Vite + Tailwind)"]
    FirebaseAuth["Firebase Authentication"]
    FirebaseRTDB["Firebase Realtime Database"]
    ExpressAPI["Node.js / Express API Server"]
    MongoDB[("MongoDB Database")]

    Client -- "1. Login / Signup" --> FirebaseAuth
    Client -- "2. Sync with Bearer Token" --> ExpressAPI
    ExpressAPI -- "3. Verify Token" --> FirebaseAuth
    ExpressAPI -- "4. Store / Query User, Events & Registrations" --> MongoDB
    ExpressAPI -- "5. Push Notification (Admin SDK)" --> FirebaseRTDB
    FirebaseRTDB -- "6. Real-Time Push Listener (onValue)" --> Client
```

---

## 7. Folder Structure

```text
Campus Connect/
├── .gitignore                          # Root Git ignore rules
├── database.rules.json                 # Firebase Realtime Database security rules
├── README.md                           # Project documentation
├── client/                             # React Frontend
│   ├── .env.example                    # Frontend environment variables template
│   ├── .gitignore
│   ├── index.html                      # HTML entrypoint
│   ├── package.json
│   ├── vite.config.js                  # Vite configuration with Tailwind CSS plugin
│   └── src/
│       ├── main.jsx                    # React root render
│       ├── App.jsx                     # Application routing & ProtectedRoute
│       ├── index.css                   # Tailwind v4 import
│       ├── components/
│       │   ├── Navbar.jsx              # Navigation header, user greeting, logout
│       │   ├── EventCard.jsx           # Reusable event card with spot capacity badge
│       │   ├── EventForm.jsx           # Form for creating/editing events
│       │   ├── NotificationPanel.jsx   # Live notification feed & mark as read
│       │   └── ProtectedRoute.jsx      # Client route protection & role redirect
│       ├── context/
│       │   └── AuthContext.jsx         # Firebase session & MongoDB profile sync
│       ├── firebase/
│       │   └── firebase.js             # Firebase Web SDK initialization
│       ├── pages/
│       │   ├── Login.jsx               # Email/password login page
│       │   ├── Signup.jsx              # Student registration page
│       │   ├── StudentDashboard.jsx    # Student view: events, registration, history
│       │   ├── ManagerDashboard.jsx    # Manager view: my events, attendee lists
│       │   ├── CreateEditEvent.jsx     # Event creation & editing page
│       │   └── Profile.jsx             # User profile view & edit
│       └── services/
│           ├── api.js                  # Plain fetch client with Bearer token
│           ├── authService.js          # Auth sync endpoints
│           ├── eventService.js         # Events & registrations API client
│           └── profileService.js       # User profile API client
└── server/                             # Express Backend
    ├── .env.example                    # Backend environment variables template
    ├── .gitignore
    ├── package.json
    ├── server.js                       # Express setup, middleware, and route mounting
    ├── config/
    │   ├── db.js                       # Mongoose MongoDB connection
    │   └── firebaseAdmin.js            # Firebase Admin SDK initialization
    ├── controllers/
    │   ├── authController.js           # Auth sync & current user profile
    │   ├── eventController.js          # Event CRUD & notification triggers
    │   ├── notificationController.js   # Notification mark-as-read
    │   ├── registrationController.js   # Event registration & attendee queries
    │   └── userController.js           # User profile endpoints
    ├── middleware/
    │   ├── requireAuth.js              # Token verification & MongoDB user attachment
    │   ├── requireRole.js              # Server role-based authorization check
    │   └── verifyToken.js              # Firebase ID token validation
    ├── models/
    │   ├── Event.js                    # Event schema
    │   ├── Registration.js             # Registration schema with compound index
    │   └── User.js                     # User schema (roles: student, eventManager)
    ├── routes/
    │   ├── authRoutes.js               # /api/auth routes
    │   ├── eventRoutes.js              # /api/events routes
    │   ├── notificationRoutes.js       # /api/notifications routes
    │   ├── registrationRoutes.js       # /api/registrations routes
    │   └── userRoutes.js               # /api/users routes
    ├── scripts/
    │   ├── makeManager.js              # CLI script: promote student to eventManager
    │   ├── test-api.js                 # API route & status code tests
    │   ├── test-auth.js                # Auth & privilege escalation tests
    │   ├── test-db.js                  # MongoDB live connection test
    │   ├── test-e2e.js                 # Complete end-to-end integration test
    │   ├── test-notifications.js       # Real-time multi-client notification test
    │   └── test-roles.js               # Middleware role authorization test
    └── services/
        └── notificationService.js      # Dispatches RTDB notifications
```

---

## 8. MongoDB Models and Relationships

### User Model (`server/models/User.js`)
- `firebaseUid`: String, required, unique
- `name`: String, required
- `email`: String, required, unique, lowercase
- `role`: String, enum: `["student", "eventManager"]`, default: `"student"`
- `department`: String, optional
- `year`: String, optional
- `timestamps`: `createdAt`, `updatedAt`

### Event Model (`server/models/Event.js`)
- `title`: String, required
- `description`: String, required
- `date`: Date, required
- `time`: String, required
- `venue`: String, required
- `capacity`: Number, required, minimum 1
- `createdBy`: ObjectId referencing `User` (Event Manager), required
- `timestamps`: `createdAt`, `updatedAt`

### Registration Model (`server/models/Registration.js`)
- `studentId`: ObjectId referencing `User`, required
- `eventId`: ObjectId referencing `Event`, required
- `registeredAt`: Date, default: `Date.now`
- **Compound Unique Index:** `{ studentId: 1, eventId: 1 }` prevents a student from registering for the same event multiple times.

---

## 9. Firebase Authentication Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new Firebase project (e.g. `campus-connect`).
2. Navigate to **Build > Authentication** and click **Get Started**.
3. Under **Sign-in method**, enable **Email/Password**.
4. In Project Settings under **General**, scroll to **Your apps**, click the Web icon (`</>`), register the app, and copy the `firebaseConfig` keys into `client/.env`.
5. Under **Service accounts**, click **Generate new private key** to download your JSON credentials file. Copy the project ID, client email, and private key into `server/.env`.

---

## 10. Firebase Realtime Database Notification Setup

1. In the Firebase Console, navigate to **Build > Realtime Database** and click **Create Database**.
2. Choose your location and start in **Locked mode**.
3. Copy the database URL (e.g. `https://your-project-id-default-rtdb.firebaseio.com/`).
4. Paste the database URL into `FIREBASE_DATABASE_URL` in `server/.env` and `VITE_FIREBASE_DATABASE_URL` in `client/.env`.
5. Navigate to the **Rules** tab in the Realtime Database and paste the contents of [database.rules.json](database.rules.json):
   ```json
   {
     "rules": {
       "notifications": {
         "$firebaseUid": {
           ".read": "auth != null && auth.uid === $firebaseUid",
           ".write": false
         }
       }
     }
   }
   ```
   - **`.read`:** Only the authenticated student can read their personal notifications.
   - **`.write: false`:** Direct client-side writes are prohibited. Notifications can only be created by the trusted backend Admin SDK.

---

## 11. Environment Variable Setup

### Backend (`server/.env`)
Create a `.env` file in the `server` directory:

```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campus_connect?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173

# Firebase Admin Service Account Credentials
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your_firebase_project_id-default-rtdb.firebaseio.com
```

### Frontend (`client/.env`)
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5001

# Firebase Web Client Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

---

## 12. Installation Commands

Clone the repository and install dependencies in both the backend and frontend:

```bash
# 1. Clone repository
git clone <repository_url>
cd "Campus Connect"

# 2. Install server dependencies
cd server
npm install

# 3. Install client dependencies
cd ../client
npm install
```

---

## 13. Commands to Run Frontend and Backend

Open two terminal windows:

### Terminal 1: Backend Server
```bash
cd server
npm run dev
# Starts backend with nodemon on http://localhost:5001
```

### Terminal 2: Frontend Client
```bash
cd client
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### Run Automated Tests
```bash
cd server
npm run test:e2e            # Master end-to-end integration test
npm run test:api            # REST API endpoints & status codes test
npm run test:roles          # Role authorization & permission checks test
npm run test:notifications  # Real-time multi-client notification test
npm run test:db             # Live MongoDB connection check
```

---

## 14. API Endpoint Documentation

All protected endpoints require the header `Authorization: Bearer <Firebase_ID_Token>`.

### Authentication
- **`GET /api/health`**
  - Public health check.
  - Returns `200 OK`: `{ "message": "Campus Connect API is running" }`
- **`POST /api/auth/sync`**
  - Protected. Syncs the Firebase user with MongoDB.
  - Body (optional): `{ "name": "Alice", "department": "CS", "year": "3rd" }`
  - Returns `200 OK` with user profile. Role defaults strictly to `"student"`.
- **`GET /api/auth/me`**
  - Protected. Returns current user profile from MongoDB.

### Users & Profiles
- **`GET /api/users/me`**
  - Protected. Returns logged-in user profile details.
- **`PATCH /api/users/me`**
  - Protected. Updates `name`, `department`, `year`.
  - Body: `{ "name": "Alice Smith", "department": "Biology", "year": "4th Year" }`
  - Returns `403 Forbidden` if client attempts to alter `role` or `firebaseUid`.

### Events
- **`GET /api/events`**
  - Public / Authenticated. Lists events ordered by date.
  - Query parameters (optional): `?search=<title>`
- **`GET /api/events/:id`**
  - Public / Authenticated. Retrieves details for a specific event.
- **`POST /api/events`**
  - Restricted to `eventManager`.
  - Body: `{ "title": "...", "description": "...", "date": "YYYY-MM-DD", "time": "10:00 AM", "venue": "...", "capacity": 100 }`
  - Returns `201 Created` and triggers student notifications in real time.
- **`PATCH /api/events/:id`**
  - Restricted to `eventManager` (creator only). Updates event details.
- **`DELETE /api/events/:id`**
  - Restricted to `eventManager` (creator only). Deletes event and purges all tied student registrations.

### Registrations
- **`POST /api/events/:id/register`**
  - Restricted to `student`.
  - Enforces: event exists, event is in the future (HTTP 400), student is not already registered (HTTP 409), and capacity is not full (HTTP 409).
  - Returns `201 Created`.
- **`GET /api/registrations/me`**
  - Restricted to `student`. Returns the student's personal registration history.
- **`GET /api/events/:id/registrations`**
  - Restricted to `eventManager` (creator only). Returns the list of registered attendees for that event.

### Notifications
- **`PATCH /api/notifications/:id/read`**
  - Protected. Marks a notification as read under the calling user's path. Returns `200 OK`.

---

## 15. How to Create a Student Account

1. Start both servers and open `http://localhost:5173/signup`.
2. Enter your Full Name, Campus Email, and Password (minimum 6 characters).
3. Click **Create Account**.
4. The client creates your Firebase login and synchronizes with the backend. The backend assigns the **Student** role by default.
5. You are redirected to `/dashboard` where you can immediately browse events, view notifications, and register.

---

## 16. How to Create an Event Manager Account

To prevent unauthorized privilege escalation, there is **no public signup** for the Event Manager role. An account is promoted through the safe administrative CLI script:

1. Have the user create an account via the signup page (e.g. `organizer@campus.edu`).
2. Run the promotion script in your backend terminal:
   ```bash
   cd server
   npm run make-manager organizer@campus.edu
   ```
3. Output confirms the role update:
   ```text
   ----------------------------------------------------
   SUCCESS: User role successfully updated!
   Name:          Claire Organizer
   Email:         organizer@campus.edu
   Previous Role: student
   New Role:      eventManager
   ----------------------------------------------------
   ```
4. When the user logs in or refreshes, they will automatically be redirected to the Manager Dashboard at `/manager`.

---

## 17. How to Test Event Creation and Registration

### Step 1: Create an Event as Event Manager
1. Log in with an Event Manager account at `http://localhost:5173/login`.
2. You will land on `/manager`. Click **+ Create New Event** (`/events/create`).
3. Fill in the event title, description, future date, time, venue, and a capacity of `2`.
4. Click **Publish Event**. The event appears on your manager dashboard.

### Step 2: Receive Real-Time Notification as Student
1. Open a second browser window (or incognito) and log in with a Student account.
2. Observe the **Campus Notifications** panel in the right sidebar.
3. The notification alert for the new event appears in real time without refreshing the page.
4. Click **Mark as read**; the unread dot disappears and the counter updates.

### Step 3: Register for the Event
1. On the Student Dashboard (`/dashboard`), find the newly created event.
2. Click **Register**. The spot counter updates, and the button changes to `Registered ✓`.
3. Switch to the **My Registered** tab to view the registration history table.

### Step 4: Verify Organizer Attendee View
1. In the Event Manager window, find the event and click **▼ View Registered Students**.
2. The newly registered student's name, email, department, and timestamp will be displayed in real time.

---

## 18. Known Limitations and Future Improvements

1. **Pagination:** `GET /api/events` currently loads all events. Future iterations should add query-based pagination (`?page=1&limit=20`) to optimize large datasets.
2. **Notification Queueing for Large Campuses:** Currently, notifications are written via `Promise.all` across all students. For universities with 10,000+ students, dispatch should use a background queue (such as Google Cloud Tasks or BullMQ) or Firebase Cloud Messaging (FCM) topics.
3. **Registration Cancellation & Waitlisting:** Adding a self-service cancellation endpoint (`DELETE /api/events/:id/register`) would allow students to release their spots to a waitlist.
4. **Campus Email Domain Verification:** Firebase email verification (`sendEmailVerification`) can be integrated to ensure users verify ownership of an authentic `.edu` campus email address before registering.
