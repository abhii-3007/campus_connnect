import React, { useState, useEffect } from 'react';

export default function EventForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Event',
  isLoading = false,
}) {
  const formatDateForInput = (rawDate) => {
    if (!rawDate) return '';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: formatDateForInput(initialData?.date),
    time: initialData?.time || '',
    venue: initialData?.venue || '',
    capacity: initialData?.capacity || initialData?.maxParticipants || '',
  });

  const [error, setError] = useState('');

  // Update form fields if initialData changes after async load
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        date: formatDateForInput(initialData.date),
        time: initialData.time || '',
        venue: initialData.venue || '',
        capacity: initialData.capacity || initialData.maxParticipants || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Frontend validation
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.date ||
      !formData.time.trim() ||
      !formData.venue.trim() ||
      formData.capacity === ''
    ) {
      setError('Please fill in all event fields.');
      return;
    }

    const numCapacity = Number(formData.capacity);
    if (isNaN(numCapacity) || numCapacity <= 0 || !Number.isInteger(numCapacity)) {
      setError('Maximum capacity must be a positive whole number.');
      return;
    }

    setError('');
    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date,
      time: formData.time.trim(),
      venue: formData.venue.trim(),
      capacity: numCapacity,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Event Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Annual Campus Hackathon"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          required
        />
      </div>

      {/* Event Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the event agenda, speaker details, and requirements..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          required
        />
      </div>

      {/* Date and Time row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time *
          </label>
          <input
            type="text"
            name="time"
            value={formData.time}
            onChange={handleChange}
            placeholder="e.g. 10:00 AM or 02:30 PM"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          />
        </div>
      </div>

      {/* Venue and Capacity row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue *
          </label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="e.g. Main Auditorium / Lab 301"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Participants (Capacity) *
          </label>
          <input
            type="number"
            name="capacity"
            min="1"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="e.g. 100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
