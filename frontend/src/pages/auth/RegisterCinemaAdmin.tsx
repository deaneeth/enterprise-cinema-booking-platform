// RegisterCinemaAdmin.tsx - Cinema Admin Registration Page
// Allows users to apply to become cinema admins
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api, { getErrorMessage } from "../../services/api";

const RegisterCinemaAdmin: React.FC = () => {
  const { currentUser: user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    businessLicense: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/api/auth/apply-cinema-admin", formData);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Login Required
          </h1>
          <p className="text-gray-400 mb-6">
            You need to be logged in to apply as a cinema administrator.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-600/20"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="w-full py-3 px-4 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/5 transition-colors"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is already a cinema admin
  if (user?.role === "cinema_admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Already a Cinema Admin
          </h1>
          <p className="text-gray-400 mb-6">
            You already have cinema administrator access.
          </p>
          <Link
            to="/admin/cinema"
            className="inline-block py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-600/20"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-400"
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
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Application Submitted!
          </h1>
          <p className="text-gray-400 mb-6">
            Your application to become a cinema administrator has been
            submitted. Our team will review your application and get back to you
            within 2-3 business days.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You'll receive an email notification once your application is
            reviewed.
          </p>
          <Link
            to="/"
            className="inline-block py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-600/20"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl mb-4 shadow-lg shadow-red-600/20">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Become a Cinema Partner
          </h1>
          <p className="text-gray-400 mt-2">
            Join CineBook and start selling tickets online
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info (readonly) */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Applying as:</p>
              <p className="font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>

            {/* Business Name */}
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Business / Cinema Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g., Galaxy Cinemas"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Business Address */}
            <div>
              <label
                htmlFor="businessAddress"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Business Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="businessAddress"
                name="businessAddress"
                required
                rows={3}
                value={formData.businessAddress}
                onChange={handleChange}
                placeholder="Full address including city, state, and ZIP code"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
              />
            </div>

            {/* Business License (Optional) */}
            <div>
              <label
                htmlFor="businessLicense"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Business License Number{" "}
                <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="businessLicense"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleChange}
                placeholder="e.g., BL-12345678"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Providing a license number speeds up the verification process
              </p>
            </div>

            {/* Terms */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h3 className="font-medium text-red-400 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Our team will review your application</li>
                <li>• You'll receive an email once approved</li>
                <li>
                  • You can then add your cinema and start managing showtimes
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCinemaAdmin;
