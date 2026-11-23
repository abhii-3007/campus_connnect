import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import EventCard from '../components/EventCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { INITIAL_EVENTS } from '../data/sampleData.js';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [feedback, setFeedback] = useState('');

  // Manager actions
  const handleEdit = (eventId) => {
    navigate(`/events/edit/${eventId}`);
  };

  const handleDelete = (eventId) => {
    const confirmed = window.confirm('Are you sure you want to delete this event?');
    if (!confirmed) return;

    setEvents((prev) => prev.filter((evt) => evt.id !== eventId));
    setFeedback('Event deleted successfully.');
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Manager info and Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Event Manager Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Logged in as <strong className="text-gray-800">{user?.name}</strong> ({user?.department})
            </p>
          </div>

          <Link
            to="/events/create"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-xs"
          >
            + Create New Event
          </Link>
        </div>

        {feedback && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
            {feedback}
          </div>
        )}

        {/* Manager Events Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Events Managed by You ({events.length})
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <p className="text-gray-500 text-sm mb-4">You have not created any events yet.</p>
              <Link
                to="/events/create"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isManager={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
