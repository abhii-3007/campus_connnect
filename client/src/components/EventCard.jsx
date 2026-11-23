import React from 'react';

export default function EventCard({
  event,
  isManager = false,
  isRegistered = false,
  onRegister,
  onEdit,
  onDelete,
}) {
  const isFull = event.registeredCount >= event.maxParticipants;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
      <div>
        {/* Header: Title and capacity tag */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-snug">
            {event.title}
          </h3>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
              isFull
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {event.registeredCount}/{event.maxParticipants} spots
          </span>
        </div>

        {/* Date, Time & Venue metadata */}
        <div className="text-sm text-gray-600 space-y-1 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Date:</span>
            <span>{event.date}</span>
            <span className="text-gray-400">•</span>
            <span className="font-medium text-gray-700">Time:</span>
            <span>{event.time}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Venue:</span> {event.venue}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {event.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-100">
        {isManager ? (
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => onEdit && onEdit(event.id)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete && onDelete(event.id)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {isFull && !isRegistered ? 'Registration Closed' : 'Open for Students'}
            </span>
            <button
              type="button"
              onClick={() => onRegister && onRegister(event.id)}
              disabled={isRegistered || isFull}
              className={`px-4 py-1.5 text-sm font-medium rounded-md ${
                isRegistered
                  ? 'bg-gray-100 text-gray-500 cursor-default'
                  : isFull
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRegistered ? 'Registered ✓' : isFull ? 'Event Full' : 'Register'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
