// UserManagement.tsx (Phase 3.3 - Platform Admin)
// User management with list, search, role change, cinema assignment, delete

import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";

interface User {
  id: string;
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "cinema_admin" | "platform_admin";
  cinemaId?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface Cinema {
  _id: string;
  name: string;
}

const getUserId = (user: User): string => user.id || user._id || "";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, cinemasRes] = await Promise.all([
        api.get("/api/users"),
        api.get("/api/cinemas"),
      ]);

      const usersData = usersRes.data?.data;
      const cinemasData = cinemasRes.data?.data;

      setUsers(Array.isArray(usersData) ? usersData : []);
      setCinemas(
        cinemasData?.cinemas || (Array.isArray(cinemasData) ? cinemasData : []),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setError(null);
      setSuccess(null);
      // When changing to cinema_admin, don't clear cinemaId
      // When changing FROM cinema_admin, clear cinemaId
      const updateData: { role: string; cinemaId?: string | null } = {
        role: newRole,
      };
      if (newRole !== "cinema_admin") {
        updateData.cinemaId = null;
      }
      await api.put(`/api/users/${userId}`, updateData);
      setSuccess("Role updated successfully");
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCinemaAssignment = async (userId: string, cinemaId: string) => {
    try {
      setError(null);
      setSuccess(null);
      await api.put(`/api/users/${userId}`, { cinemaId: cinemaId || null });
      setSuccess("Cinema assigned successfully");
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to deactivate this user?"))
      return;

    try {
      setError(null);
      await api.delete(`/api/users/${userId}`);
      setSuccess("User deactivated successfully");
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      setError(null);
      setSuccess(null);
      await api.put(`/api/users/${userId}`, { isActive: !currentStatus });
      setSuccess(currentStatus ? "User deactivated successfully" : "User reactivated successfully");
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.firstName + " " + u.lastName)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "platform_admin":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      case "cinema_admin":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      default:
        return "bg-white/10 text-gray-300 border border-white/10";
    }
  };

  const getCinemaName = (cinemaId?: string) => {
    if (!cinemaId) return "Not assigned";
    const cinema = cinemas.find((c) => c._id === cinemaId);
    return cinema?.name || "Unknown";
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage users, roles, and cinema assignments"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="" className="bg-[#1a1a2e]">All Roles</option>
          <option value="user" className="bg-[#1a1a2e]">User</option>
          <option value="cinema_admin" className="bg-[#1a1a2e]">Cinema Admin</option>
          <option value="platform_admin" className="bg-[#1a1a2e]">Platform Admin</option>
        </select>
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-white">
            {users.filter((u) => u.role === "user").length}
          </div>
          <div className="text-sm text-gray-400">Regular Users</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-blue-400">
            {users.filter((u) => u.role === "cinema_admin").length}
          </div>
          <div className="text-sm text-gray-400">Cinema Admins</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-purple-400">
            {users.filter((u) => u.role === "platform_admin").length}
          </div>
          <div className="text-sm text-gray-400">Platform Admins</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Assigned Cinema
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
                {filteredUsers.map((user) => (
                  <tr
                    key={getUserId(user)}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-medium">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        </div>
                        <div className="font-medium text-white">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(getUserId(user), e.target.value)
                        }
                        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${getRoleBadge(user.role)}`}
                      >
                        <option value="user" className="bg-[#1a1a2e]">User</option>
                        <option value="cinema_admin" className="bg-[#1a1a2e]">Cinema Admin</option>
                        <option value="platform_admin" className="bg-[#1a1a2e]">Platform Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {user.role === "cinema_admin" ? (
                        <select
                          value={user.cinemaId || ""}
                          onChange={(e) =>
                            handleCinemaAssignment(
                              getUserId(user),
                              e.target.value,
                            )
                          }
                          className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white cursor-pointer min-w-[150px]"
                        >
                          <option value="" className="bg-[#1a1a2e]">-- Select Cinema --</option>
                          {cinemas.map((cinema) => (
                            <option key={cinema._id} value={cinema._id} className="bg-[#1a1a2e]">
                              {cinema.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.isActive !== false
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}>
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(getUserId(user), user.isActive !== false)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          user.isActive !== false
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                        }`}
                      >
                        {user.isActive !== false ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h4 className="font-medium text-blue-400 mb-2">
          📝 How to assign a Cinema Admin:
        </h4>
        <ol className="text-sm text-blue-300 space-y-1 list-decimal list-inside">
          <li>
            Change the user's role to <strong>Cinema Admin</strong>
          </li>
          <li>
            Select their cinema from the <strong>Assigned Cinema</strong>{" "}
            dropdown
          </li>
          <li>
            The admin can now only manage showtimes and bookings for that cinema
          </li>
        </ol>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
