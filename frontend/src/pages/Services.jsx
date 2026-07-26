// ============================================================
// services.jsx  (enhanced responsive Services page)
// ============================================================
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Services() {
  return (
    <div className="services-page">
      <Navbar />

      {/* Hero Header */}
      <section className="services-hero">
        <div className="container">
          <div className="services-hero-content">
            <span className="services-badge">✦ Our Services</span>
            <h1 className="services-hero-title">Our Services</h1>
            <p className="services-hero-subtitle">
              Comprehensive solutions tailored for each role in our ecosystem
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="services-main">
        <div className="container">
          <div className="services-grid">
            {/* For Students */}
            <div className="service-card">
              <div className="service-card-header">
                <div className="service-icon-wrapper" style={{ background: "linear-gradient(135deg, #066A67, #457B79)" }}>
                  <span className="service-icon">🎓</span>
                </div>
                <h3>For Students</h3>
                <p>Tools and features designed to help students showcase their innovations</p>
              </div>
              <ul className="service-features">
                <li>📝 Project Submission Portal</li>
                <li>📊 Profile & Portfolio Builder</li>
                <li>💰 Funding Request System</li>
                <li>🤝 Investor Matching Algorithm</li>
                <li>📈 Progress Tracking Dashboard</li>
                <li>📚 Documentation & Resource Library</li>
                <li>🧠 Mentorship Connection</li>
                <li>💬 Project Feedback System</li>
              </ul>
            </div>

            {/* For Investors */}
            <div className="service-card">
              <div className="service-card-header">
                <div className="service-icon-wrapper" style={{ background: "linear-gradient(135deg, #457B79, #90C1BE)" }}>
                  <span className="service-icon">💼</span>
                </div>
                <h3>For Investors</h3>
                <p>Powerful tools for discovering and investing in promising innovations</p>
              </div>
              <ul className="service-features">
                <li>🔍 Project Discovery Engine</li>
                <li>🔎 Advanced Search & Filtering</li>
                <li>📊 Investment Analytics Dashboard</li>
                <li>📁 Portfolio Management Tools</li>
                <li>📋 Risk Assessment Reports</li>
                <li>💬 Direct Communication Channel</li>
                <li>📈 Market Trend Analysis</li>
                <li>🔒 Secure Transaction Processing</li>
              </ul>
            </div>

            {/* For Administrators */}
            <div className="service-card">
              <div className="service-card-header">
                <div className="service-icon-wrapper" style={{ background: "linear-gradient(135deg, #024644, #066A67)" }}>
                  <span className="service-icon">⚙️</span>
                </div>
                <h3>For Administrators</h3>
                <p>Complete system management and oversight tools</p>
              </div>
              <ul className="service-features">
                <li>👤 User Management System</li>
                <li>✅ Project Approval Workflow</li>
                <li>📊 System Monitoring Dashboard</li>
                <li>🔒 Security & Compliance Controls</li>
                <li>📈 Analytics & Reporting Suite</li>
                <li>⚖️ Content Moderation Tools</li>
                <li>🔔 Automated Notification System</li>
                <li>🗄️ Database Management Interface</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="platform-features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✦ Features</span>
            <h2>Platform Features</h2>
            <p className="section-subtitle">
              Everything you need for successful innovation collaboration
            </p>
          </div>

          <div className="platform-features-grid">
            <div className="platform-feature-item">
              <div className="feature-check-icon">🔒</div>
              <span>Secure & Encrypted Data Storage</span>
            </div>
            <div className="platform-feature-item">
              <div className="feature-check-icon">📱</div>
              <span>Mobile Responsive Design</span>
            </div>
            <div className="platform-feature-item">
              <div className="feature-check-icon">🔔</div>
              <span>Real-time Notifications</span>
            </div>
            <div className="platform-feature-item">
              <div className="feature-check-icon">📄</div>
              <span>Document Upload & Management</span>
            </div>
            <div className="platform-feature-item">
              <div className="feature-check-icon">📊</div>
              <span>Progress Tracking & Analytics</span>
            </div>
            <div className="platform-feature-item">
              <div className="feature-check-icon">👥</div>
              <span>Multi-role Access Control</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}