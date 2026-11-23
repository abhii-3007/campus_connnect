import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute component for client-side user experience navigation.
 * Note: Backend API authorization (requireAuth, requireRole) remains mandatory for security.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // 1. While Firebase authentication / session is loading, show simple loading message
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

  // 2. Redirect unauthenticated users to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Application role retrieved from the backend user profile
  const userRole = user.role === 'event_manager' ? 'eventManager' : user.role;
  const normalizedAllowed = allowedRoles?.map((r) =>
    r === 'event_manager' ? 'eventManager' : r
  );

  // 4. Role-based redirections
  if (normalizedAllowed && !normalizedAllowed.includes(userRole)) {
    // Redirect students away from event-manager pages
    if (userRole === 'student') {
      return <Navigate to="/dashboard" replace />;
    }
    // Redirect event managers away from student-only registration pages/actions
    if (userRole === 'eventManager') {
      return <Navigate to="/manager" replace />;
    }
  }

  return children;
}
