import React, { useEffect } from "react";

const Terms: React.FC = () => {
  useEffect(() => {
    document.title = "Terms of Service | CineFlick";
  }, []);

  const lastUpdated = "January 1, 2026";

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-400 leading-relaxed">
              By accessing and using CineFlick's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">2. Use License</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                Permission is granted to temporarily access the materials on CineFlick's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software contained on CineFlick's website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">3. Booking Terms</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                When you book tickets through CineFlick:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All bookings are subject to availability and confirmation</li>
                <li>Prices are subject to change without notice</li>
                <li>You must provide accurate and complete information</li>
                <li>Tickets are non-transferable unless otherwise stated</li>
                <li>CineFlick acts as an intermediary between you and the cinema</li>
              </ul>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">4. Cancellation & Refunds</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                Our cancellation and refund policy is as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancellations made more than 4 hours before showtime are eligible for a full refund</li>
                <li>Cancellations made within 4 hours of showtime may incur a cancellation fee</li>
                <li>No refunds are available after the showtime has started</li>
                <li>Refunds are processed within 5-7 business days</li>
                <li>In case of show cancellation by the cinema, full refunds will be automatically processed</li>
              </ul>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">5. User Account</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                When you create an account with us:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You agree to accept responsibility for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>We reserve the right to terminate accounts that violate our terms</li>
              </ul>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-400 leading-relaxed">
              CineFlick shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the services.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">7. Changes to Terms</h2>
            <p className="text-gray-400 leading-relaxed">
              CineFlick reserves the right to revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then-current version of these Terms of Service.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">8. Contact Information</h2>
            <p className="text-gray-400 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
              <br /><br />
              <strong className="text-white">Email:</strong> legal@cineflick.com
              <br />
              <strong className="text-white">Address:</strong> 123 Cinema Street, Hollywood, CA 90028
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
