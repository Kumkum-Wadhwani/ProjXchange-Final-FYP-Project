// ============================================================
// contact.jsx  (enhanced responsive Contact page)
// ============================================================
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your message! We'll contact you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="contact-page">
      <Navbar />

      {/* Hero Header */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <span className="contact-badge">✦ Get in Touch</span>
            <h1 className="contact-hero-title">Contact Us</h1>
            <p className="contact-hero-subtitle">
              Get in touch with the ProjXchange team
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <div className="contact-form-card">
                <h3>Send us a Message</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Type your message here..."
                      rows="6"
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-btn">
                    Send Message
                    <span className="btn-arrow">→</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="contact-info-wrapper">
              <div className="contact-info-card">
                <h3>Contact Information</h3>

                <div className="info-item">
                  <div className="info-icon-wrapper" style={{ background: "linear-gradient(135deg, #066A67, #457B79)" }}>
                    <span className="info-icon">📧</span>
                  </div>
                  <div className="info-content">
                    <h4>Email Address</h4>
                    <p>projxchange@gmail.com</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper" style={{ background: "linear-gradient(135deg, #457B79, #90C1BE)" }}>
                    <span className="info-icon">👥</span>
                  </div>
                  <div className="info-content">
                    <h4>Development Team</h4>
                    <p>Sarah (2212304)</p>
                    <p>Kumkum (2212289)</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper" style={{ background: "linear-gradient(135deg, #90C1BE, #C2E1DF)" }}>
                    <span className="info-icon">🎓</span>
                  </div>
                  <div className="info-content">
                    <h4>Project Information</h4>
                    <p>Final Year Project 2026</p>
                    <p>University Program</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper" style={{ background: "linear-gradient(135deg, #C2E1DF, #066A67)" }}>
                    <span className="info-icon">⏰</span>
                  </div>
                  <div className="info-content">
                    <h4>Response Time</h4>
                    <p>We typically respond within 24-48 hours</p>
                  </div>
                </div>

                <div className="platform-support">
                  <h4>Platform Support</h4>
                  <p>
                    For technical support or platform inquiries, please include
                    your user role (Student, Investor, or Admin) in your message
                    for faster assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}