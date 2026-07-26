import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navbar />
      
      {/* HERO SECTION */}
      <div className="home-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h6 className="hero-subtitle">Innovation Meets Investment</h6>
              <h1>
                Welcome to <span className="gradient-text">ProjXchange</span>
              </h1>
              <p className="hero-description">
                The premier platform connecting student innovators with visionary investors. 
                Transform academic projects into real-world solutions with our secure, 
                transparent ecosystem.
              </p>
              
              <div className="hero-cta">
                <button 
                  className="primary-hero-btn" 
                  onClick={() => navigate('/welcome')}
                >
                  Explore Platform
                </button>
                <button 
                  className="secondary-hero-btn" 
                  onClick={() => navigate('/about')}
                >
                  Learn More
                </button>
              </div>
              
              <div className="hero-highlights">
                <div className="highlight-item">
                  <div className="highlight-icon">🚀</div>
                  <div className="highlight-text">
                    <span className="highlight-number">100+</span>
                    <span className="highlight-label">Active Projects</span>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">💼</div>
                  <div className="highlight-text">
                    <span className="highlight-number">50+</span>
                    <span className="highlight-label">Verified Investors</span>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">💰</div>
                  <div className="highlight-text">
                    <span className="highlight-number">₹2M+</span>
                    <span className="highlight-label">Funds Invested</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hero-image">
              <img 
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Team Collaboration" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* PLATFORM OVERVIEW */}
      <div className="platform-overview">
        <div className="container">
          <div className="section-header">
            <h2>For Everyone, Everything</h2>
            <p>Tailored solutions for every role in the innovation ecosystem</p>
          </div>
          
          <div className="platform-grid">
            <div className="platform-card student-platform">
              <div className="platform-header">
                <div className="platform-icon">🎓</div>
                <h3>For Students</h3>
              </div>
              <div className="platform-body">
                <p>
                  Showcase your projects, get expert feedback, and connect with 
                  investors who believe in your vision.
                </p>
                <ul className="platform-features">
                  <li>Project Management Dashboard</li>
                  <li>Portfolio Builder</li>
                  <li>Investor Matching</li>
                  <li>Progress Tracking</li>
                </ul>
              </div>
              <button 
                className="platform-btn" 
                onClick={() => navigate('/login?role=student')}
              >
                Start as Student
              </button>
            </div>
            
            <div className="platform-card investor-platform">
              <div className="platform-header">
                <div className="platform-icon">💼</div>
                <h3>For Investors</h3>
              </div>
              <div className="platform-body">
                <p>
                  Discover high-potential projects, invest in future innovations, 
                  and track your investments with ease.
                </p>
                <ul className="platform-features">
                  <li>Smart Project Discovery</li>
                  <li>Risk Analysis Tools</li>
                  <li>Portfolio Management</li>
                  <li>Real-time Updates</li>
                </ul>
              </div>
              <button 
                className="platform-btn" 
                onClick={() => navigate('/login?role=investor')}
              >
                Join as Investor
              </button>
            </div>
            
            <div className="platform-card admin-platform">
              <div className="platform-header">
                <div className="platform-icon">⚙️</div>
                <h3>For Administrators</h3>
              </div>
              <div className="platform-body">
                <p>
                  Manage the platform, ensure security, and maintain a healthy 
                  ecosystem for all users.
                </p>
                <ul className="platform-features">
                  <li>User Management System</li>
                  <li>Content Moderation</li>
                  <li>Analytics Dashboard</li>
                  <li>Security Monitoring</li>
                </ul>
              </div>
              <button 
                className="platform-btn" 
                onClick={() => navigate('/login?role=admin')}
              >
                Admin Access
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS STORIES */}
      <div className="success-stories">
        <div className="container">
          <div className="section-header">
            <h2>Success Stories</h2>
            <p>See how our users are making an impact</p>
          </div>
          
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-header">
                <div className="story-avatar">S</div>
                <div className="story-info">
                  <h4>Sarah Chen</h4>
                  <p>Computer Science Student</p>
                </div>
              </div>
              <div className="story-content">
                <p>
                  "Secured ₹500,000 funding for Smart Campus System project. 
                  Platform made investor matching seamless."
                </p>
              </div>
              <div className="story-footer">
                <span className="story-category">AI/ML Project</span>
                <span className="story-status">Funded</span>
              </div>
            </div>
            
            <div className="story-card">
              <div className="story-header">
                <div className="story-avatar">R</div>
                <div className="story-info">
                  <h4>Raj Patel</h4>
                  <p>Engineering Student</p>
                </div>
              </div>
              <div className="story-content">
                <p>
                  "Found 3 perfect projects to invest in. ROI tracking tools 
                  are incredibly helpful for decision making."
                </p>
              </div>
              <div className="story-footer">
                <span className="story-category">Investor</span>
                <span className="story-status">Active</span>
              </div>
            </div>
            
            <div className="story-card">
              <div className="story-header">
                <div className="story-avatar">M</div>
                <div className="story-info">
                  <h4>Michael Zhang</h4>
                  <p>Angel Investor</p>
                </div>
              </div>
              <div className="story-content">
                <p>
                  "Invested in 5 student projects. Platform's due diligence 
                  tools saved me countless hours of research."
                </p>
              </div>
              <div className="story-footer">
                <span className="story-category">Multiple Investments</span>
                <span className="story-status">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROCESS FLOW */}
      <div className="process-flow">
        <div className="container">
          <div className="section-header">
            <h2>Simple & Secure Process</h2>
            <p>From idea to implementation, we've got you covered</p>
          </div>
          
          <div className="flow-steps">
            <div className="flow-step">
              <div className="step-circle">
                <span>1</span>
              </div>
              <h4>Register</h4>
              <p>Sign up with your details</p>
            </div>
            
            <div className="flow-arrow">→</div>
            
            <div className="flow-step">
              <div className="step-circle">
                <span>2</span>
              </div>
              <h4>Create Profile</h4>
              <p>Build your portfolio</p>
            </div>
            
            <div className="flow-arrow">→</div>
            
            <div className="flow-step">
              <div className="step-circle">
                <span>3</span>
              </div>
              <h4>Connect</h4>
              <p>Find matches</p>
            </div>
            
            <div className="flow-arrow">→</div>
            
            <div className="flow-step">
              <div className="step-circle">
                <span>4</span>
              </div>
              <h4>Collaborate</h4>
              <p>Start working together</p>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="home-final-cta">
        <div className="container">
          <div className="cta-wrapper">
            <h2>Start Your Innovation Journey Today</h2>
            <p>
              Join our growing community of innovators and investors. 
              Whether you're a student with a groundbreaking idea or an 
              investor looking for the next big thing, ProjXchange is 
              your platform for success.
            </p>
            <div className="cta-actions">
              <button 
                className="primary-action-btn" 
                onClick={() => navigate('/login')}
              >
                Get Started Free
              </button>
              <button 
                className="secondary-action-btn" 
                onClick={() => navigate('/about')}
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}