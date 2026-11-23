import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Show a clean loading indicator while checking Firebase session persistence
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-sm text-gray-500">Checking session...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, verify against user's server-enforced role
  // Normalizes both 'eventManager' and 'event_manager' formats for compatibility
  const userRole = user.role === 'eventManager' ? 'event_manager' : user.role;
  const normalizedAllowed = allowedRoles?.map((r) =>
    r === 'eventManager' ? 'event_manager' : r
  );

  if (normalizedAllowed && !normalizedAllowed.includes(userRole)) {
    if (userRole === 'event_manager') {
      return <Navigate to="/manager-dashboard" replace />;
    }
    return <Navigate to="/student-dashboard" replace />;
  }

  return children;
}
