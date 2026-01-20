// UserProfile.tsx (Member 1)
// User profile - Redesigned with Apple Human Interface Guidelines
// Premium UI with soft shadows, generous whitespace, smooth animations

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usersApi, getErrorMessage } from "../../services/api";

interface EditFormData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile: React.FC = () => {
  const { currentUser, updateUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<EditFormData>({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const getInitials = (firstName: string, lastName: string): string =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "platform_admin":
        return { bg: "rgba(175, 82, 222, 0.12)", color: "#af52de" };
      case "cinema_admin":
        return { bg: "rgba(0, 122, 255, 0.12)", color: "#007aff" };
      default:
        return { bg: "rgba(52, 199, 89, 0.12)", color: "#34c759" };
    }
  };

  const formatRole = (role: string): string =>
    role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const handlePasswordSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: "3px solid #e5e5e5", borderTopColor: "#007aff" }}
        />
      </div>
    );
  }

  const roleStyle = getRoleStyle(currentUser.role);

  // Input field styles
  const inputStyle = {
    background: "#f5f5f7",
    borderRadius: "14px",
    border: "none",
    fontSize: "16px",
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div
          className="p-4 flex items-center gap-3 transition-all duration-300"
          style={{
            background: "rgba(52, 199, 89, 0.1)",
            borderRadius: "16px",
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: "#34c759" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p style={{ color: "#34c759" }} className="font-medium">
            {successMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-4 flex items-center gap-3 transition-all duration-300"
          style={{
            background: "rgba(255, 59, 48, 0.1)",
            borderRadius: "16px",
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: "#ff3b30" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <p style={{ color: "#ff3b30" }} className="font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Profile Card */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Header with Avatar */}
        <div className="p-8 flex items-center gap-6">
          {/* Avatar */}
          <div
            className="w-20 h-20 flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
              borderRadius: "24px",
              boxShadow: "0 8px 24px rgba(0, 122, 255, 0.3)",
            }}
          >
            <span className="text-2xl font-bold text-white">
              {getInitials(currentUser.firstName, currentUser.lastName)}
            </span>
          </div>

          {/* Name and Email */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-2xl font-bold text-gray-900 truncate"
              style={{ letterSpacing: "-0.02em" }}
            >
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="mt-1 text-gray-500 truncate">{currentUser.email}</p>
            <span
              className="inline-block mt-3 px-3 py-1.5 text-xs font-semibold"
              style={{
                background: roleStyle.bg,
                color: roleStyle.color,
                borderRadius: "10px",
              }}
            >
              {formatRole(currentUser.role)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-8"
          style={{ height: "1px", background: "rgba(0,0,0,0.05)" }}
        />

        {/* Profile Info / Edit Form */}
        <div className="p-8">
          {!isEditMode ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    First Name
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {currentUser.firstName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Last Name
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {currentUser.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {currentUser.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Member Since
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {currentUser.createdAt
                      ? formatDate(currentUser.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-6 py-3 font-semibold text-white transition-all duration-200"
                  style={{
                    background:
                      "linear-gradient(135deg, #007aff 0%, #0055b3 100%)",
                    borderRadius: "14px",
                  }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100"
                  style={{ borderRadius: "14px" }}
                >
                  Change Password
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="block w-full px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="block w-full px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="block w-full px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 font-semibold text-white transition-all duration-200 disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, #34c759 0%, #30a14e 100%)",
                    borderRadius: "14px",
                  }}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 disabled:opacity-50"
                  style={{ borderRadius: "14px" }}
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
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            background: "#fff",
            borderRadius: "24px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="p-8">
            <h3
              className="text-xl font-bold text-gray-900 mb-6"
              style={{ letterSpacing: "-0.01em" }}
            >
              Change Password
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="block w-full px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="block w-full px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="block w-full px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 font-semibold text-white transition-all duration-200 disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, #007aff 0%, #0055b3 100%)",
                    borderRadius: "14px",
                  }}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  disabled={isLoading}
                  className="px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 disabled:opacity-50"
                  style={{ borderRadius: "14px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
