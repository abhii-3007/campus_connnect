import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import profileService from '../services/profileService.js';

export default function Profile() {
  const { user, updateProfile: updateLocalUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    year: '',
    role: '',
  });

  // Fetch actual profile from backend GET /api/users/me
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await profileService.getMyProfile();
      if (data?.user) {
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          department: data.user.department || '',
          year: data.user.year || '',
          role: data.user.role || 'student',
        });
        updateLocalUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load profile:', err.message);
      setError(err.message || 'Unable to load profile data from the server.');
      // Fallback to auth context user if present
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          department: user.department || '',
          year: user.year || '',
          role: user.role || 'student',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save profile changes using PATCH /api/users/me
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');

    if (!formData.name.trim()) {
      setError('Name cannot be empty.');
      setSaving(false);
      return;
    }

    try {
      const result = await profileService.updateMyProfile({
        name: formData.name.trim(),
        department: formData.department.trim(),
        year: formData.year.trim(),
      });

      if (result?.user) {
        setFormData((prev) => ({
          ...prev,
          name: result.user.name,
          department: result.user.department,
          year: result.user.year,
        }));
        updateLocalUser(result.user);
      }

      setIsEditing(false);
      setFeedback('Profile details saved successfully.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      console.error('Profile update failed:', err.message);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile();
  };

  const isManager =
    formData.role === 'eventManager' || formData.role === 'event_manager';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your personal and academic information.
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

        {/* Loading State */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500 shadow-xs">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
            <p>Loading profile from server...</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {formData.name || 'Campus Member'}
                </h2>
                <span className="text-xs text-gray-500">{formData.email}</span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isManager
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isManager ? 'Event Manager' : 'Student'}
              </span>
            </div>

            {isEditing ? (
              /* Editable Profile Form */
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campus Email (read-only)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year of Study
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="e.g. 3rd Year"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            ) : (
              /* Read-only view */
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-medium text-gray-500">Full Name</span>
                  <p className="text-sm font-medium text-gray-800">{formData.name}</p>
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-500">Email</span>
                  <p className="text-sm font-medium text-gray-800">{formData.email}</p>
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-500">Department</span>
                  <p className="text-sm font-medium text-gray-800">
                    {formData.department || 'Not specified'}
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-500">Year of Study</span>
                  <p className="text-sm font-medium text-gray-800">
                    {formData.year || 'Not specified'}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
