import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import EventCard from '../components/EventCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import eventService from '../services/eventService.js';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Attendee inspection state
  const [viewingRegistrationsEventId, setViewingRegistrationsEventId] = useState(null);
  const [registrationsData, setRegistrationsData] = useState(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Fetch events created by the logged-in manager
  const loadManagerEvents = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await eventService.getEvents();
      const allEvents = response.events || [];

      // Filter events created by this manager
      const managerUserId = user?.id || user?._id;
      const myEvents = allEvents.filter((evt) => {
        const creatorId = evt.createdBy?._id || evt.createdBy;
        return creatorId === managerUserId;
      });

      setEvents(myEvents);
    } catch (err) {
      console.error('Failed to load manager events:', err.message);
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerEvents();
  }, [user]);

  // Edit event
  const handleEdit = (eventId) => {
    navigate(`/events/edit/${eventId}`);
  };

  // Delete event
  const handleDelete = async (eventId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this event? All student registrations for this event will also be removed.'
    );
    if (!confirmed) return;

    setError('');
    setFeedback('');

    try {
      const result = await eventService.deleteEvent(eventId);
      setFeedback(result.message || 'Event deleted successfully.');

      // Close registration drawer if open for this event
      if (viewingRegistrationsEventId === eventId) {
        setViewingRegistrationsEventId(null);
        setRegistrationsData(null);
      }

      await loadManagerEvents();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to delete event:', err.message);
      setError(err.message || 'Failed to delete event.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // View registrations for a specific event
  const handleViewRegistrations = async (eventId) => {
    if (viewingRegistrationsEventId === eventId) {
      // Toggle off
      setViewingRegistrationsEventId(null);
      setRegistrationsData(null);
      return;
    }

    setViewingRegistrationsEventId(eventId);
    setLoadingRegistrations(true);
    try {
      const data = await eventService.getEventRegistrations(eventId);
      setRegistrationsData(data);
    } catch (err) {
      console.error('Error loading registrations:', err.message);
      setRegistrationsData({ registrations: [] });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Manager information & Create Event action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Event Manager Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Logged in as <strong className="text-gray-800">{user?.name}</strong>{' '}
              {user?.department ? `(${user.department})` : ''}
            </p>
          </div>

          <Link
            to="/events/create"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-xs transition-colors"
          >
            + Create New Event
          </Link>
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

        {/* Loading State */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-500 shadow-xs">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2"></div>
            <p>Loading your managed events...</p>
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-xs">
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              No events created yet
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Schedule your first campus event to begin accepting registrations from students.
            </p>
            <Link
              to="/events/create"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
            >
              Create an event
            </Link>
          </div>
        ) : (
          /* Events Grid */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Your Created Events ({events.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((evt) => {
                const evtId = evt._id || evt.id;
                const isViewing = viewingRegistrationsEventId === evtId;

                return (
                  <div key={evtId} className="flex flex-col space-y-2">
                    <EventCard
                      event={evt}
                      isManager={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />

                    {/* Registrations Inspection Button */}
                    <button
                      type="button"
                      onClick={() => handleViewRegistrations(evtId)}
                      className={`w-full py-1.5 px-3 text-xs font-medium rounded border transition-colors ${
                        isViewing
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {isViewing ? '▲ Hide Registrations' : '▼ View Registered Students'}
                    </button>

                    {/* Inline Attendee Viewer */}
                    {isViewing && (
                      <div className="bg-white border border-blue-200 rounded-lg p-3 text-xs shadow-xs space-y-2">
                        <div className="flex justify-between items-center font-medium text-gray-700 border-b pb-1">
                          <span>Registered Students</span>
                          <span className="text-blue-600">
                            {registrationsData?.registrations?.length || 0} attending
                          </span>
                        </div>

                        {loadingRegistrations ? (
                          <div className="text-center py-2 text-gray-400">Loading attendees...</div>
                        ) : registrationsData?.registrations?.length === 0 ? (
                          <div className="text-gray-500 py-1 italic">No students registered yet.</div>
                        ) : (
                          <ul className="divide-y divide-gray-100 max-h-40 overflow-y-auto pr-1">
                            {registrationsData?.registrations?.map((reg) => (
                              <li key={reg.id} className="py-1.5 flex justify-between items-center">
                                <div>
                                  <span className="font-semibold text-gray-800 block">
                                    {reg.student?.name || 'Student'}
                                  </span>
                                  <span className="text-gray-500 text-[11px]">
                                    {reg.student?.email} • {reg.student?.department || 'General'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  {reg.registeredAt
                                    ? new Date(reg.registeredAt).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
