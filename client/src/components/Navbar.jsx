import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isManager =
    user?.role === 'eventManager' || user?.role === 'event_manager';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand Title */}
          <div className="flex items-center space-x-3">
            <Link
              to={isManager ? '/manager' : '/dashboard'}
              className="text-xl font-bold text-blue-600 hover:text-blue-700"
            >
              Campus Connect
            </Link>
            {user && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isManager
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isManager ? 'Event Manager' : 'Student'}
              </span>
            )}
          </div>

          {/* Navigation Items */}
          {user ? (
            <div className="flex items-center space-x-4">
              {/* Dashboard Link */}
              <Link
                to={isManager ? '/manager' : '/dashboard'}
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                {isManager ? 'Manager Dashboard' : 'Events'}
              </Link>

              {/* Event Manager specific action */}
              {isManager && (
                <Link
                  to="/events/create"
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium"
                >
                  + Create Event
                </Link>
              )}

              {/* Profile Link */}
              <Link
                to="/profile"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                Profile
              </Link>

              {/* User greeting */}
              <span className="hidden sm:inline text-sm text-gray-500">
                Hi,{' '}
                <strong className="text-gray-800 font-medium">
                  {user.name ? user.name.split(' ')[0] : 'Member'}
                </strong>
              </span>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
