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

// Root navigation redirect based on trusted backend profile role
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-700">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-sm font-medium text-gray-600">Loading Campus Connect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isManager = user.role === 'eventManager' || user.role === 'event_manager';
  return isManager ? <Navigate to="/manager" replace /> : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Student Dashboard: /dashboard (Students only; Managers redirected to /manager) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Event Manager Dashboard: /manager (Managers only; Students redirected to /dashboard) */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['eventManager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Create & Edit Event Routes (Event Managers only) */}
          <Route
            path="/events/create"
            element={
              <ProtectedRoute allowedRoles={['eventManager']}>
                <CreateEditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['eventManager']}>
                <CreateEditEvent />
              </ProtectedRoute>
            }
          />

          {/* Profile Route (Accessible by any authenticated user) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Backward compatibility redirects */}
          <Route path="/student-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/manager-dashboard" element={<Navigate to="/manager" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
