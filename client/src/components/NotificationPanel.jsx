import React from 'react';

export default function NotificationPanel({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
        No notifications right now.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
        <h3 className="font-semibold text-gray-800 text-sm">Campus Notifications</h3>
        <span className="text-xs text-blue-600 font-medium">
          {notifications.filter((n) => !n.read).length} new
        </span>
      </div>

      <ul className="space-y-2.5">
        {notifications.map((item) => (
          <li
            key={item.id}
            className={`p-2.5 rounded-md text-sm flex items-start justify-between gap-2 ${
              item.read ? 'bg-gray-50 text-gray-600' : 'bg-blue-50 text-gray-800 font-normal border-l-3 border-blue-500'
            }`}
          >
            <div>
              <p className="text-sm">{item.message}</p>
              <span className="text-xs text-gray-400 block mt-1">{item.time}</span>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                className="text-xs text-gray-400 hover:text-gray-600 p-1"
                title="Dismiss"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
