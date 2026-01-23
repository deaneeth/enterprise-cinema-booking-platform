import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const About: React.FC = () => {
  useEffect(() => {
    document.title = "About Us | CineFlick";
  }, []);

  const team = [
    { name: "Sarah Chen", role: "CEO & Founder", image: "👩‍💼" },
    { name: "Marcus Johnson", role: "CTO", image: "👨‍💻" },
    { name: "Emily Rodriguez", role: "Head of Operations", image: "👩‍💼" },
    { name: "David Kim", role: "Head of Partnerships", image: "👨‍💼" },
  ];

  const stats = [
    { value: "500+", label: "Partner Cinemas" },
    { value: "10M+", label: "Tickets Sold" },
    { value: "50+", label: "Cities" },
    { value: "4.8★", label: "App Rating" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              About <span className="text-red-500">CineFlick</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to transform the movie-going experience. From discovering the latest blockbusters to booking your perfect seat, CineFlick makes cinema magic accessible to everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-red-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Founded in 2020, CineFlick started with a simple idea: make booking movie tickets as enjoyable as watching the movie itself.
                </p>
                <p>
                  Our founders, avid movie enthusiasts themselves, were frustrated with the fragmented booking experience across different cinemas. They envisioned a unified platform that would bring together all cinemas, all movies, and all showtimes in one beautiful interface.
                </p>
                <p>
                  Today, CineFlick partners with over 500 cinemas across 50+ cities, serving millions of movie lovers who trust us to deliver seamless booking experiences every day.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center">
                <div className="text-9xl">🎬</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-red-500/20 flex items-center justify-center text-3xl">
                🎯
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Customer First</h3>
              <p className="text-gray-400">
                Every feature we build, every decision we make, starts with our customers in mind.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-blue-500/20 flex items-center justify-center text-3xl">
                🚀
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Innovation</h3>
              <p className="text-gray-400">
                We continuously push boundaries to create the best possible movie booking experience.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-green-500/20 flex items-center justify-center text-3xl">
                🤝
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Partnership</h3>
              <p className="text-gray-400">
                We believe in growing together with our cinema partners and creating mutual success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Leadership Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-4xl">
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-gray-400">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-red-900/30 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience CineFlick?</h2>
          <p className="text-gray-400 mb-8">
            Join millions of movie lovers who book their cinema experiences with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/movies"
              className="px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              Browse Movies
            </Link>
            <Link
              to="/register/cinema-admin"
              className="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
            >
              Partner with Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
