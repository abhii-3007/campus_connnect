import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import EventForm from '../components/EventForm.jsx';
import eventService from '../services/eventService.js';

export default function CreateEditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If editing, fetch existing event data from GET /api/events/:id
  useEffect(() => {
    if (!isEditing) return;

    const fetchExistingEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await eventService.getEventById(id);
        if (response?.event) {
          setInitialData(response.event);
        } else {
          setError('Event details could not be found.');
        }
      } catch (err) {
        console.error('Failed to load event for editing:', err.message);
        setError(err.message || 'Failed to load event data.');
      } finally {
        setLoading(false);
      }
    };

    fetchExistingEvent();
  }, [id, isEditing]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await eventService.updateEvent(id, formData);
      } else {
        await eventService.createEvent(formData);
      }

      navigate('/manager');
    } catch (err) {
      console.error('Failed to save event:', err.message);
      setError(err.message || 'Failed to save event. Please check inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/manager');
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
              ? 'Update event details and capacity in the form below.'
              : 'Publish a new campus event and notify all registered students in real-time.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            ✕ {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-500 shadow-xs">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2"></div>
            <p>Loading event information...</p>
          </div>
        ) : (
          <EventForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel={isEditing ? 'Update Event' : 'Publish Event'}
            isLoading={submitting}
          />
        )}
      </main>
    </div>
  );
}
