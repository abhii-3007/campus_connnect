import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import EventForm from '../components/EventForm.jsx';
import { INITIAL_EVENTS } from '../data/sampleData.js';

export default function CreateEditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Look up existing event if editing
  const existingEvent = isEditing
    ? INITIAL_EVENTS.find((evt) => evt.id === id)
    : null;

  const handleSubmit = (formData) => {
    // In future phases, this will trigger POST/PUT /api/events
    console.log(isEditing ? 'Updating event:' : 'Creating event:', formData);
    alert(isEditing ? 'Event updated successfully!' : 'Event created successfully!');
    navigate('/manager-dashboard');
  };

  const handleCancel = () => {
    navigate('/manager-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isEditing
              ? 'Update details for this campus event.'
              : 'Fill in the information below to schedule and publish a campus event.'}
          </p>
        </div>

        <EventForm
          initialData={existingEvent}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel={isEditing ? 'Update Event' : 'Publish Event'}
        />
      </main>
    </div>
  );
}
