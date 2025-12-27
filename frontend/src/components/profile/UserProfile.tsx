// UserProfile.tsx (Member 1)
// User profile component - Displays and edits user information
// Includes profile display, edit mode, and password change functionality

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usersApi, getErrorMessage } from "../../services/api";

// User data interface
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "cinema_admin" | "platform_admin";
  isActive: boolean;
  createdAt: string;
}

// Edit form data interface
interface EditFormData {
  firstName: string;
  lastName: string;
  phone: string;
}

// Password change form data interface
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile: React.FC = () => {
  const { currentUser, updateUser } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<EditFormData>({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialize edit form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditForm({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Get user initials for avatar
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "platform_admin":
        return "bg-purple-100 text-purple-800";
      case "cinema_admin":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Format role for display
  const formatRole = (role: string): string => {
    return role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Handle edit form input change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle password form input change
  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (!currentUser) return;

      const response = await usersApi.update(currentUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone || undefined,
      });

      if (response.data.success) {
        // Update auth context with new user data
        updateUser({
          ...currentUser,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone || undefined,
        });
        setSuccessMessage("Profile updated successfully!");
        setIsEditMode(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      if (!currentUser) return;

      const response = await usersApi.changePassword(currentUser.id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        setSuccessMessage("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsChangingPassword(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = (): void => {
    if (currentUser) {
      setEditForm({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        phone: currentUser.phone || "",
      });
    }
    setIsEditMode(false);
    setError(null);
  };

  // Cancel password change
  const handleCancelPassword = (): void => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsChangingPassword(false);
    setError(null);
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
          <div className="flex items-center space-x-4">
            {/* Avatar with Initials */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {getInitials(currentUser.firstName, currentUser.lastName)}
              </span>
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <p className="text-indigo-200">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Info / Edit Form */}
        <div className="p-6">
          {!isEditMode ? (
            // Display Mode
            <>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {currentUser.email}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {currentUser.phone || "Not provided"}
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Role
                  </label>
                  <span
                    className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                      currentUser.role
                    )}`}
                  >
                    {formatRole(currentUser.role)}
                  </span>
                </div>

                {/* Member Since */}
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Member Since
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {currentUser.createdAt
                      ? formatDate(currentUser.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </>
          ) : (
            // Edit Mode
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditChange}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditChange}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      {isChangingPassword && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                onClick={handleCancelPassword}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
