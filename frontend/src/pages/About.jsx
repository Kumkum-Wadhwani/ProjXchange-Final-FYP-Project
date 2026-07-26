// ============================================================
// about.jsx  (enhanced responsive About page)
// ============================================================
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="about-page">
      <Navbar />

      {/* Hero / Page Header */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <span className="about-badge">✦ About Us</span>
            <h1 className="about-hero-title">About ProjXchange</h1>
            <p className="about-hero-subtitle">
              Connecting Student Innovation with Real-World Investment Opportunities
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="about-main">
        <div className="container">
          <div className="about-grid">
            <div className="about-text">
              <p>
                ProjXchange is our Final Year Project for the Bachelor's degree program,
                developed to address a critical gap in the innovation ecosystem. We
                identified that many exceptional student projects remain confined
                within academic walls, lacking the platform and exposure needed to
                attract real-world investment.
              </p>
              <p>
                Our platform serves as a bridge between academic excellence and
                entrepreneurial opportunity. We provide students with the tools to
                showcase their work, connect with investors, and transform theoretical
                knowledge into practical, market-ready solutions.
              </p>

              <div className="mission-card">
                <div className="mission-icon">🎯</div>
                <div className="mission-content">
                  <h3>Our Mission</h3>
                  <p>
                    To democratize access to innovation funding by creating a transparent,
                    secure, and efficient ecosystem where student talent meets investment
                    opportunity. We aim to foster the next generation of entrepreneurs,
                    problem-solvers, and industry leaders.
                  </p>
                </div>
              </div>
            </div>

            <div className="about-visual">
              <div className="about-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Students collaborating on innovative projects"
                  loading="lazy"
                />
                <div className="image-overlay">
                  <span>Innovation in Action</span>
                </div>
              </div>
              <div className="image-stats">
                <div className="stat-chip">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Student Projects</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-number">20+</span>
                  <span className="stat-label">Investors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✦ Team</span>
            <h2>Meet Our Development Team</h2>
            <p className="section-subtitle">Final Year Project 2026</p>
          </div>

          <div className="team-grid">
            <div className="team-card">
              <div className="member-avatar" style={{ background: "linear-gradient(135deg, #066A67, #457B79)" }}>
                <span>S</span>
              </div>
              <h3>Sarah</h3>
              <p className="student-id">Student ID: 2212304</p>
            </div>

            <div className="team-card">
              <div className="member-avatar" style={{ background: "linear-gradient(135deg, #457B79, #90C1BE)" }}>
                <span>K</span>
              </div>
              <h3>Kumkum</h3>
              <p className="student-id">Student ID: 2212289</p>
            </div>
          </div>

          <div className="project-details-card">
            <h3>📋 Project Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Project</span>
                <span className="detail-value">ProjXchange - Innovation Platform</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Year</span>
                <span className="detail-value">2026</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Purpose</span>
                <span className="detail-value">Final Year Project</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Supervisor</span>
                <span className="detail-value">Sir Abid Ali</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}