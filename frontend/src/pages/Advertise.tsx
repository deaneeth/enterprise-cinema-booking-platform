import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Advertise: React.FC = () => {
  useEffect(() => {
    document.title = "Advertise with Us | CineFlick";
  }, []);

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    budget: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const adFormats = [
    {
      icon: "📱",
      title: "Homepage Banners",
      description: "Premium placement on our homepage reaching all visitors",
      reach: "1M+ impressions/month",
    },
    {
      icon: "🎬",
      title: "Movie Page Ads",
      description: "Targeted ads on movie detail pages",
      reach: "500K+ impressions/month",
    },
    {
      icon: "📧",
      title: "Email Campaigns",
      description: "Sponsored content in our newsletters",
      reach: "100K+ subscribers",
    },
    {
      icon: "🎟️",
      title: "E-Ticket Branding",
      description: "Your brand on digital tickets",
      reach: "250K+ tickets/month",
    },
  ];

  const stats = [
    { value: "2M+", label: "Monthly Users" },
    { value: "500K+", label: "Bookings/Month" },
    { value: "18-45", label: "Core Demographic" },
    { value: "85%", label: "Mobile Users" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-purple-900/30 to-red-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Advertise with <span className="text-red-500">CineFlick</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Reach millions of movie enthusiasts with targeted advertising opportunities across our platform.
          </p>
          <a
            href="#contact-form"
            className="inline-block px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-red-500 mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Formats */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Advertising Formats</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adFormats.map((format, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="text-4xl mb-4">{format.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{format.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{format.description}</p>
                <div className="text-sm text-red-400 font-medium">{format.reach}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Advertise */}
      <section className="py-20 bg-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Why Advertise with Us?</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Engaged Audience</h4>
                    <p className="text-gray-400 text-sm">Our users actively seek entertainment, making them receptive to relevant ads.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Precise Targeting</h4>
                    <p className="text-gray-400 text-sm">Target by location, movie genre preferences, and booking behavior.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Measurable Results</h4>
                    <p className="text-gray-400 text-sm">Detailed analytics and reporting on ad performance.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Flexible Budgets</h4>
                    <p className="text-gray-400 text-sm">Solutions for businesses of all sizes, from startups to enterprises.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-600/20 to-red-600/20 border border-white/10 flex items-center justify-center">
                <div className="text-9xl">📊</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Get in Touch</h2>

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Request Received!</h3>
                <p className="text-gray-400">
                  Our advertising team will contact you within 1-2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Advertising Budget *</label>
                  <select
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="" className="bg-[#1a1a2e]">Select budget range</option>
                    <option value="1k-5k" className="bg-[#1a1a2e]">$1,000 - $5,000</option>
                    <option value="5k-10k" className="bg-[#1a1a2e]">$5,000 - $10,000</option>
                    <option value="10k-25k" className="bg-[#1a1a2e]">$10,000 - $25,000</option>
                    <option value="25k+" className="bg-[#1a1a2e]">$25,000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tell us about your campaign</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder="What are your advertising goals?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-500 hover:to-red-600 transition-all"
                >
                  Submit Request
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Advertise;
