import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';
import CreateEditEvent from './pages/CreateEditEvent.jsx';
import Profile from './pages/Profile.jsx';

// Component to handle default root navigation based on current auth state
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-sm text-gray-500">Loading Campus Connect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isManager = user.role === 'eventManager' || user.role === 'event_manager';
  return isManager ? (
    <Navigate to="/manager-dashboard" replace />
  ) : (
    <Navigate to="/student-dashboard" replace />
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Student Dashboard */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'eventManager', 'event_manager']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Event Manager Dashboard */}
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute allowedRoles={['eventManager', 'event_manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Create & Edit Event Routes (Restricted to Event Manager) */}
          <Route
            path="/events/create"
            element={
              <ProtectedRoute allowedRoles={['eventManager', 'event_manager']}>
                <CreateEditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['eventManager', 'event_manager']}>
                <CreateEditEvent />
              </ProtectedRoute>
            }
          />

          {/* Profile Route (Accessible by all authenticated users) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
