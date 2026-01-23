import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Corporate: React.FC = () => {
  useEffect(() => {
    document.title = "Corporate Bookings | CineFlick";
  }, []);

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    eventType: "",
    attendees: "",
    preferredDate: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const services = [
    {
      icon: "🏢",
      title: "Private Screenings",
      description: "Book entire theaters for your team, clients, or special events",
      features: ["Exclusive theater access", "Customizable experience", "Catering options"],
    },
    {
      icon: "🎉",
      title: "Team Events",
      description: "Perfect for team building, celebrations, and company milestones",
      features: ["Group discounts", "Flexible scheduling", "Event coordination"],
    },
    {
      icon: "🎁",
      title: "Bulk Tickets",
      description: "Purchase tickets in bulk for employee rewards or client gifts",
      features: ["Volume discounts", "Digital delivery", "Custom branding"],
    },
    {
      icon: "🤝",
      title: "Partnerships",
      description: "Long-term partnerships for ongoing entertainment needs",
      features: ["Dedicated account manager", "Priority booking", "Custom packages"],
    },
  ];

  const benefits = [
    "Dedicated corporate account manager",
    "Priority booking and availability",
    "Flexible cancellation policies",
    "Consolidated monthly billing",
    "Custom branding opportunities",
    "VIP treatment for your guests",
  ];

  const clients = [
    "Fortune 500 companies",
    "Tech startups",
    "Marketing agencies",
    "Educational institutions",
    "Non-profit organizations",
    "Government agencies",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-900/30 to-purple-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-medium mb-6">
            Corporate Solutions
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Elevate Your Corporate Events
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Create memorable experiences for your team and clients with our premium corporate booking services.
          </p>
          <a
            href="#inquiry-form"
            className="inline-block px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Request a Quote
          </a>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Corporate Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{service.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                    <p className="text-gray-400 mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Clients */}
      <section className="py-20 bg-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Corporate Benefits</h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Clients */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Trusted By</h2>
              <div className="grid grid-cols-2 gap-4">
                {clients.map((client, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl border border-white/10 p-4 text-center"
                  >
                    <span className="text-gray-300">{client}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Submit Inquiry", desc: "Tell us about your event needs" },
              { step: "02", title: "Get a Quote", desc: "Receive a customized proposal" },
              { step: "03", title: "Plan Together", desc: "Work with your account manager" },
              { step: "04", title: "Enjoy the Event", desc: "Create memorable experiences" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry-form" className="py-20 bg-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Request a Quote</h2>

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Inquiry Received!</h3>
                <p className="text-gray-400">
                  Our corporate team will contact you within 24 hours with a customized proposal.
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Event Type *</label>
                    <select
                      required
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="" className="bg-[#1a1a2e]">Select event type</option>
                      <option value="private-screening" className="bg-[#1a1a2e]">Private Screening</option>
                      <option value="team-event" className="bg-[#1a1a2e]">Team Event</option>
                      <option value="bulk-tickets" className="bg-[#1a1a2e]">Bulk Tickets</option>
                      <option value="partnership" className="bg-[#1a1a2e]">Partnership</option>
                      <option value="other" className="bg-[#1a1a2e]">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Number of Attendees *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.attendees}
                      onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Date</label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Details</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    placeholder="Tell us more about your event..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-500 hover:to-red-600 transition-all"
                >
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need Help Planning?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Our corporate team is here to help you create the perfect event. Contact us directly for immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/10"
            >
              Contact Us
            </Link>
            <a
              href="tel:+1234567890"
              className="px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              Call: (123) 456-7890
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Corporate;
