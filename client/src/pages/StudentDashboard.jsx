import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import EventCard from '../components/EventCard.jsx';
import NotificationPanel from '../components/NotificationPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { INITIAL_EVENTS, INITIAL_NOTIFICATIONS } from '../data/sampleData.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [registeredEventIds, setRegisteredEventIds] = useState(['evt-1']);
  const [filter, setFilter] = useState('all');

  // Event registration handler
  const handleRegister = (eventId) => {
    if (registeredEventIds.includes(eventId)) return;

    setRegisteredEventIds((prev) => [...prev, eventId]);

    // Update spot count locally for demo
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? { ...evt, registeredCount: evt.registeredCount + 1 }
          : evt
      )
    );

    // Add a confirmation notification
    const targetedEvent = events.find((e) => e.id === eventId);
    if (targetedEvent) {
      setNotifications((prev) => [
        {
          id: 'notif-' + Date.now(),
          message: `Successfully registered for "${targetedEvent.title}"!`,
          time: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    }
  };

  const handleDismissNotification = (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  // Filter events: all vs my registrations
  const displayedEvents = events.filter((evt) => {
    if (filter === 'registered') {
      return registeredEventIds.includes(evt.id);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Explore campus events, secure your spot, and stay updated with peer activities.
          </p>
        </div>

        {/* Dashboard Grid: Notifications & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Events Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter and count header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Campus Events
                </h2>
                <span className="text-xs text-gray-500">
                  Showing {displayedEvents.length} events
                </span>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-200 rounded-md p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded font-medium ${
                    filter === 'all'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Events
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('registered')}
                  className={`px-3 py-1 rounded font-medium ${
                    filter === 'registered'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Registered ({registeredEventIds.length})
                </button>
              </div>
            </div>

            {/* Event Cards Grid */}
            {displayedEvents.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
                No events found matching this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    isManager={false}
                    isRegistered={registeredEventIds.includes(evt.id)}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Notifications */}
          <div className="space-y-4">
            <NotificationPanel
              notifications={notifications}
              onDismiss={handleDismissNotification}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
