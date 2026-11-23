import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import EventCard from '../components/EventCard.jsx';
import NotificationPanel from '../components/NotificationPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import eventService from '../services/eventService.js';

export default function StudentDashboard() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);

  const [filter, setFilter] = useState('all'); // 'all' or 'registered'
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Fetch live events and current student registrations
  const loadData = async (query = '') => {
    setLoading(true);
    setError('');

    try {
      const [eventsResponse, registrationsResponse] = await Promise.all([
        eventService.getEvents(query),
        eventService.getMyRegistrations().catch((err) => {
          console.warn('Could not load registrations:', err.message);
          return { registrations: [] };
        }),
      ]);

      setEvents(eventsResponse.events || []);
      setRegistrations(registrationsResponse.registrations || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search input handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  // Set of registered event IDs
  const registeredEventIds = new Set(
    registrations.map((r) => r.eventId?._id || r.eventId)
  );

  // Register for an event
  const handleRegister = async (eventId) => {
    setError('');
    setFeedback('');
    setRegisteringId(eventId);

    try {
      const result = await eventService.registerForEvent(eventId);
      setFeedback(result.message || 'Registration successful! Your spot is reserved.');

      // Refresh events and registration list
      await loadData(searchQuery);

      setTimeout(() => setFeedback(''), 5000);
    } catch (err) {
      console.error('Registration failed:', err.message);
      setError(err.message || 'Registration could not be completed.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setRegisteringId(null);
    }
  };

  // Filter events based on selected tab
  const displayedEvents = events.filter((evt) => {
    const evtId = evt._id || evt.id;
    if (filter === 'registered') {
      return registeredEventIds.has(evtId);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Browse upcoming campus events, register for sessions, and stay connected with peer activities.
          </p>
        </div>

        {/* Feedback / Alert Banners */}
        {feedback && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
            ✓ {feedback}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            ✕ {error}
          </div>
        )}

        {/* Dashboard Grid: Events & Real-time Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Events Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Search Bar & Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events by title..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium rounded-md"
                >
                  Search
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      loadData('');
                    }}
                    className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* Tabs */}
              <div className="flex bg-gray-200 rounded-md p-1 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Events ({events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('registered')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    filter === 'registered'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Registered ({registrations.length})
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-500">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2"></div>
                <p>Loading campus events from server...</p>
              </div>
            ) : displayedEvents.length === 0 ? (
              /* Empty State */
              <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-sm text-gray-500">
                {filter === 'registered'
                  ? "You haven't registered for any events yet. Check out 'All Events' above to sign up!"
                  : searchQuery
                  ? `No events found matching "${searchQuery}".`
                  : 'No upcoming campus events scheduled at this time.'}
              </div>
            ) : (
              /* Event Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedEvents.map((evt) => {
                  const evtId = evt._id || evt.id;
                  const isRegistered = registeredEventIds.has(evtId);

                  return (
                    <EventCard
                      key={evtId}
                      event={evt}
                      isManager={false}
                      isRegistered={isRegistered}
                      isRegistering={registeringId === evtId}
                      onRegister={handleRegister}
                    />
                  );
                })}
              </div>
            )}

            {/* Registration History Section (when on registered tab) */}
            {filter === 'registered' && registrations.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Registration History Details
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Event</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Date & Time</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Venue</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Registered On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {registrations.map((reg) => (
                        <tr key={reg._id}>
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {reg.eventId?.title || 'Event'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {reg.eventId?.date
                              ? new Date(reg.eventId.date).toLocaleDateString()
                              : 'N/A'}{' '}
                            • {reg.eventId?.time || ''}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {reg.eventId?.venue || 'N/A'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-400">
                            {reg.registeredAt
                              ? new Date(reg.registeredAt).toLocaleDateString()
                              : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Real-Time Notification Panel */}
          <div className="space-y-4">
            <NotificationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
