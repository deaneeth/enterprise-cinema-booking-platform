// Profile.tsx (Member 1)
// Profile page - Redesigned with Apple Human Interface Guidelines
// Premium UI with soft shadows, generous whitespace, and smooth animations

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import UserProfile from "../components/profile/UserProfile";
import BookingHistory from "../components/profile/BookingHistory";
import PaymentHistory from "../components/profile/PaymentHistory";

type TabType = "profile" | "bookings" | "payments";

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

  useEffect(() => {
    if (tabParam === "bookings" || tabParam === "payments") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const tabs: Tab[] = [
    {
      id: "profile",
      label: "Profile",
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
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "bookings",
      label: "Bookings",
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
            strokeWidth={1.5}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          />
        </svg>
      ),
    },
    {
      id: "payments",
      label: "Payments",
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
            strokeWidth={1.5}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
  ];

  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case "profile":
        return <UserProfile />;
      case "bookings":
        return <BookingHistory />;
      case "payments":
        return <PaymentHistory />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #f5f5f7 0%, #ffffff 100%)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      {/* Header */}
      <div className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-4xl font-bold text-gray-900 tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Account
          </h1>
          <p className="mt-2 text-lg text-gray-500" style={{ lineHeight: 1.6 }}>
            Manage your profile and preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Apple-style Segmented Control */}
        <div
          className="p-1.5 rounded-2xl mb-10"
          style={{
            background: "rgba(0, 0, 0, 0.04)",
          }}
        >
          <nav className="flex gap-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5
                  rounded-xl font-semibold text-sm
                  transition-all duration-300 ease-out
                  ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-lg"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
                style={{
                  boxShadow:
                    activeTab === tab.id
                      ? "0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)"
                      : "none",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content with Animation */}
        <div
          className="transition-all duration-500 ease-out"
          style={{ minHeight: "400px" }}
        >
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
