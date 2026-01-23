import React, { useEffect } from "react";

const Privacy: React.FC = () => {
  useEffect(() => {
    document.title = "Privacy Policy | CineFlick";
  }, []);

  const lastUpdated = "January 1, 2026";

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Account Information:</strong> Name, email address, phone number, and password when you create an account</li>
                <li><strong className="text-white">Booking Information:</strong> Details of movies, showtimes, seats, and payment information when you make bookings</li>
                <li><strong className="text-white">Communication Data:</strong> Information you provide when you contact our support team</li>
                <li><strong className="text-white">Usage Data:</strong> Information about how you use our services, including pages visited and features used</li>
              </ul>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process your bookings and send confirmation details</li>
                <li>Communicate with you about your bookings and account</li>
                <li>Personalize your experience and provide recommendations</li>
                <li>Improve our services and develop new features</li>
                <li>Detect and prevent fraud and unauthorized access</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">3. Information Sharing</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Cinema Partners:</strong> To fulfill your bookings</li>
                <li><strong className="text-white">Payment Processors:</strong> To process your payments securely</li>
                <li><strong className="text-white">Service Providers:</strong> Who help us operate our platform</li>
                <li><strong className="text-white">Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>
              <p>
                We do not sell your personal information to third parties.
              </p>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
            <p className="text-gray-400 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, secure servers, and regular security audits.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">5. Your Rights</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p>
                To exercise these rights, please contact us at privacy@cineflick.com.
              </p>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">6. Cookies</h2>
            <div className="text-gray-400 leading-relaxed space-y-4">
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep you signed in</li>
                <li>Remember your preferences</li>
                <li>Understand how you use our services</li>
                <li>Deliver relevant advertisements</li>
              </ul>
              <p>
                You can control cookies through your browser settings.
              </p>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">7. Children's Privacy</h2>
            <p className="text-gray-400 leading-relaxed">
              Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-400 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p className="text-gray-400 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us:
              <br /><br />
              <strong className="text-white">Email:</strong> privacy@cineflick.com
              <br />
              <strong className="text-white">Address:</strong> 123 Cinema Street, Hollywood, CA 90028
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
