import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();
  
  const handleRoleSelect = (role) => {
    localStorage.setItem("selectedRole", role);
    navigate("/login", { state: { selectedRole: role } });
  };

  return (
    <div className="welcome-page">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="hero-modern">
        <div className="hero-container container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-badge">Welcome to ProjXchange</div>
              <h1 className="hero-title">
                Where <span>Student Innovation</span>
                <br />Meets <span>Smart Investment</span>
              </h1>
              <p className="hero-subtitle">
                A secure platform connecting bright student minds with visionary investors. 
                Showcase projects, discover groundbreaking ideas, and transform academic 
                excellence into real-world impact.
              </p>
              
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">100+</span>
                  <span className="stat-label">Active Projects</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Verified Investors</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">2M+</span>
                  <span className="stat-label">Funds Invested</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">95%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
              
              <div className="hero-actions">
                <button className="btn-primary-lg" onClick={() => navigate('/login')}>
                  Get Started Now
                </button>
                <button className="btn-secondary-lg" onClick={() => navigate('/about')}>
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="hero-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Students collaborating on innovation" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PATHWAYS SECTION */}
      <section className="pathways-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Start Your Journey</h2>
            <p className="section-subtitle">
              Choose your pathway to innovation and growth
            </p>
          </div>
          
          <div className="pathways-grid">
            <div className="pathway-card" onClick={() => handleRoleSelect("student")}>
              <div className="pathway-icon">🎓</div>
              <h3>Student Innovator</h3>
              <p>
                Showcase academic projects, attract funding, and transform ideas 
                into reality with mentorship support.
              </p>
              <ul className="pathway-features">
                <li>Project Upload & Management</li>
                <li>Investor Matching</li>
                <li>Portfolio Building Tools</li>
                <li>Secure Document Sharing</li>
              </ul>
              <button className="pathway-btn" onClick={() => handleRoleSelect("student")}>
                Join as Student
              </button>
            </div>
            
            <div className="pathway-card" onClick={() => handleRoleSelect("investor")}>
              <div className="pathway-icon">💼</div>
              <h3>Investor</h3>
              <p>
                Discover high-potential student ventures, invest in future innovation, 
                and track ROI with analytics.
              </p>
              <ul className="pathway-features">
                <li>Advanced Project Discovery</li>
                <li>Risk Assessment Analytics</li>
                <li>Portfolio Management</li>
                <li>Secure Payment Gateway</li>
              </ul>
              <button className="pathway-btn" onClick={() => handleRoleSelect("investor")}>
                Join as Investor
              </button>
            </div>
            
            <div className="pathway-card" onClick={() => handleRoleSelect("admin")}>
              <div className="pathway-icon">⚙️</div>
              <h3>Administrator</h3>
              <p>
                Oversee platform operations, ensure security compliance, and maintain 
                transparent system governance.
              </p>
              <ul className="pathway-features">
                <li>User Management System</li>
                <li>Project Approval Workflow</li>
                <li>Security Monitoring</li>
                <li>System Configuration</li>
              </ul>
              <button className="pathway-btn" onClick={() => handleRoleSelect("admin")}>
                Admin Access
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-modern">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose ProjXchange?</h2>
            <p className="section-subtitle">
              Comprehensive tools designed for your success
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🔒</span>
              </div>
              <h3>Bank-Level Security</h3>
              <p>
                Enterprise-grade encryption and data protection ensuring your 
                information stays private and secure.
              </p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🚀</span>
              </div>
              <h3>Fast & Efficient</h3>
              <p>
                Quick project submissions and streamlined processes for maximum 
                productivity and innovation speed.
              </p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">📊</span>
              </div>
              <h3>Smart Analytics</h3>
              <p>
                Comprehensive insights and data visualization for informed 
                decision making and performance tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Simple steps to start your innovation journey
            </p>
          </div>
          
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Sign Up</h4>
              <p>Create your account</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h4>Build Profile</h4>
              <p>Complete your profile</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h4>Connect</h4>
              <p>Upload projects or browse opportunities</p>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <h4>Collaborate</h4>
              <p>Secure funding and bring ideas to life</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL SECTION */}
      <section className="testimonial-modern">
        <div className="container">
          <div className="testimonial-card-modern">
            <div className="quote-symbol">"</div>
            <p className="testimonial-text-modern">
              "ProjXchange helped me secure funding for my final year project. 
              The platform made it incredibly easy to connect with investors 
              who truly understood my vision."
            </p>
            <div className="testimonial-author-modern">
              <div className="author-avatar">S</div>
              <div className="author-info">
                <h4>Sarah Chen</h4>
                <p>Computer Science Student</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta-modern">
        <div className="cta-container container">
          <h2>Ready to Transform Your Ideas?</h2>
          <p>
            Join hundreds of innovators and investors who are already shaping 
            the future together. Start your journey today.
          </p>
          <div className="cta-actions">
            <button 
              className="btn-cta-primary" 
              onClick={() => handleRoleSelect("student")}
            >
              Start as Student
            </button>
            <button 
              className="btn-cta-secondary" 
              onClick={() => handleRoleSelect("investor")}
            >
              Explore as Investor
            </button>
          </div>
          <p className="cta-note">
            Already have an account? 
            <span onClick={() => navigate('/login')}>Sign In here</span>
          </p>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}