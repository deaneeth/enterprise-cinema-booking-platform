import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Help: React.FC = () => {
  useEffect(() => {
    document.title = "Help Center | CineFlick";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: "🎟️",
      title: "Booking & Tickets",
      articles: [
        "How to book tickets",
        "Modify or cancel booking",
        "View booking history",
        "Download e-tickets",
      ],
    },
    {
      icon: "💳",
      title: "Payments & Refunds",
      articles: [
        "Payment methods accepted",
        "How to request a refund",
        "Refund timeline",
        "Payment failed issues",
      ],
    },
    {
      icon: "👤",
      title: "Account & Profile",
      articles: [
        "Create an account",
        "Reset password",
        "Update profile information",
        "Delete account",
      ],
    },
    {
      icon: "🏢",
      title: "Cinemas & Venues",
      articles: [
        "Find cinemas near you",
        "Cinema facilities",
        "Accessibility information",
        "Food & beverages",
      ],
    },
    {
      icon: "📱",
      title: "Technical Support",
      articles: [
        "App not working",
        "QR code issues",
        "Browser compatibility",
        "Clear cache & cookies",
      ],
    },
    {
      icon: "🤝",
      title: "Cinema Partners",
      articles: [
        "Become a partner",
        "Partner dashboard guide",
        "Showtime management",
        "Revenue reports",
      ],
    },
  ];

  const popularArticles = [
    { title: "How to book movie tickets", views: "12.5K views" },
    { title: "Request a refund for cancelled show", views: "8.2K views" },
    { title: "Download your e-ticket", views: "6.8K views" },
    { title: "Update or cancel your booking", views: "5.4K views" },
    { title: "Payment options available", views: "4.9K views" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {/* Hero Section with Search */}
      <section className="py-16 bg-gradient-to-br from-red-900/20 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How can we <span className="text-red-500">help?</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Search our knowledge base or browse categories below
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help articles..."
              className="w-full px-6 py-4 pl-14 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article, index) => (
              <Link
                key={index}
                to="#"
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                    📄
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-red-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{article.views}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article, idx) => (
                    <li key={idx}>
                      <Link
                        to="#"
                        className="text-gray-400 hover:text-red-400 transition-colors text-sm flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        {article}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-red-900/30 to-purple-900/30 rounded-2xl border border-white/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Still need help?</h2>
            <p className="text-gray-400 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                to="/faq"
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
              >
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Help;
