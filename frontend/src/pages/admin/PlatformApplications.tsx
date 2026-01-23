// PlatformApplications.tsx - Manage Cinema Admin Applications
import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  applicationStatus: "pending" | "approved" | "rejected";
  businessName?: string;
  businessAddress?: string;
  businessLicense?: string;
  appliedAt?: string;
  reviewedAt?: string;
}

interface Cinema {
  _id: string;
  name: string;
}

const PlatformApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">(
    "pending",
  );
  const [processing, setProcessing] = useState<string | null>(null);

  // Modal state for approval
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [approvalCinemaId, setApprovalCinemaId] = useState("");
  const [createNewCinema, setCreateNewCinema] = useState(true);

  // Modal state for rejection
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const [appsRes, cinemasRes] = await Promise.all([
        api.get(`/api/admin/applications?status=${statusFilter}`),
        api.get("/api/cinemas"),
      ]);
      setApplications(appsRes.data?.data || []);
      const cinemaData = cinemasRes.data?.data;
      setCinemas(
        Array.isArray(cinemaData) ? cinemaData : cinemaData?.cinemas || [],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleOpenApprove = (app: Application) => {
    setSelectedApp(app);
    setApprovalCinemaId("");
    setCreateNewCinema(true);
    setShowApproveModal(true);
  };

  const handleOpenReject = (app: Application) => {
    setSelectedApp(app);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setProcessing(selectedApp.id);
    setError(null);

    try {
      await api.put(`/api/admin/applications/${selectedApp.id}/approve`, {
        cinemaId: createNewCinema ? undefined : approvalCinemaId,
        createCinema: createNewCinema,
      });
      setSuccess(
        `Application from ${selectedApp.firstName} ${selectedApp.lastName} approved!`,
      );
      setShowApproveModal(false);
      fetchApplications();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setProcessing(selectedApp.id);
    setError(null);

    try {
      await api.put(`/api/admin/applications/${selectedApp.id}/reject`, {
        reason: rejectionReason,
      });
      setSuccess(
        `Application from ${selectedApp.firstName} ${selectedApp.lastName} rejected.`,
      );
      setShowRejectModal(false);
      fetchApplications();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "approved":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-white/10 text-gray-400 border border-white/10";
    }
  };

  return (
    <AdminLayout
      title="Cinema Admin Applications"
      subtitle="Review and manage applications"
    >
      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            statusFilter === "pending"
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
              : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
              : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
          }`}
        >
          All Applications
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
          {success}
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {statusFilter === "pending"
              ? "No pending applications"
              : "No applications found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Applicant
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Business
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Applied
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">
                        {app.firstName} {app.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{app.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-white">
                        {app.businessName || "-"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {app.businessAddress || ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.applicationStatus)}`}
                      >
                        {app.applicationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {app.applicationStatus === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenApprove(app)}
                            disabled={processing === app.id}
                            className="px-3 py-1 text-sm bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(app)}
                            disabled={processing === app.id}
                            className="px-3 py-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Approve Application
            </h2>
            <p className="text-gray-300 mb-4">
              Approve{" "}
              <strong className="text-white">
                {selectedApp.firstName} {selectedApp.lastName}
              </strong>{" "}
              as a cinema admin for <strong className="text-white">{selectedApp.businessName}</strong>?
            </p>

            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={createNewCinema}
                  onChange={() => setCreateNewCinema(true)}
                  className="w-4 h-4 text-red-500"
                />
                <span className="text-sm text-gray-300">
                  Create new cinema from application
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!createNewCinema}
                  onChange={() => setCreateNewCinema(false)}
                  className="w-4 h-4 text-red-500"
                />
                <span className="text-sm text-gray-300">
                  Assign to existing cinema
                </span>
              </label>

              {!createNewCinema && (
                <select
                  value={approvalCinemaId}
                  onChange={(e) => setApprovalCinemaId(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Select a cinema to assign"
                >
                  <option value="" className="bg-[#1a1a2e]">Select a cinema...</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema._id} value={cinema._id} className="bg-[#1a1a2e]">
                      {cinema.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={!createNewCinema && !approvalCinemaId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-500 hover:to-green-600 disabled:opacity-50"
              >
                {processing ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Reject Application
            </h2>
            <p className="text-gray-300 mb-4">
              Reject the application from{" "}
              <strong className="text-white">
                {selectedApp.firstName} {selectedApp.lastName}
              </strong>
              ?
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600"
              >
                {processing ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PlatformApplications;
