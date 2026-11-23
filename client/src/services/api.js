import { auth } from '../firebase/firebase.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Core HTTP client using plain fetch.
 * Automatically attaches Firebase ID token for authenticated requests.
 * Handles JSON request formatting and informative error responses.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...options.headers,
  };

  // Attach Content-Type for JSON body if not set
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Retrieve Firebase ID token if user is signed in
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (tokenErr) {
      console.warn('Could not retrieve Firebase ID token:', tokenErr.message);
    }
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Parse JSON response body if present
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status} (${response.statusText})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Re-throw with readable message
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to the Campus Connect backend server. Please ensure the server is running.'
      );
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};

export default api;
