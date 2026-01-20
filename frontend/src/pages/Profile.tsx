// Profile.tsx (Member 1)
// Profile page - Main profile page with tabs for different sections
// Uses UserProfile component and placeholders for Member 5's components

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import UserProfile from "../components/profile/UserProfile";
import BookingHistory from "../components/profile/BookingHistory";
import PaymentHistory from "../components/profile/PaymentHistory";

// Tab type
type TabType = "profile" | "bookings" | "payments";

// Tab interface
interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const Profile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabType =
    tabParam === "bookings" || tabParam === "payments" ? tabParam : "profile";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam === "bookings" || tabParam === "payments") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  // Tab definitions
  const tabs: Tab[] = [
    {
      id: "profile",
      label: "Profile Info",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "bookings",
      label: "My Bookings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          />
        </svg>
      ),
    },
    {
      id: "payments",
      label: "Payment History",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
  ];

  // Render tab content based on active tab
  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case "profile":
        return <UserProfile />;
      case "bookings":
        // BookingHistory component (Member 5)
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <BookingHistory />
          </div>
        );
      case "payments":
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <PaymentHistory />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="mt-2 text-indigo-200">
            Manage your profile, bookings, and payment history
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex space-x-1 p-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg
                  font-medium text-sm transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default Profile;
