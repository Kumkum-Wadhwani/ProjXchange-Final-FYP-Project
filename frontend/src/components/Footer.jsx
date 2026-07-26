import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About ProjXchange</h3>
            <p>
              ProjXchange is a platform designed to connect student innovators 
              with investors, creating opportunities for academic projects to 
              become real-world solutions.
            </p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/welcome">Welcome</Link>
            <Link to="/about">About Us</Link>
            <Link to="/services">Services</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login">Login</Link>
          </div>
          
          <div className="footer-section">
            <h4>Platform Access</h4>
            <Link to="/login?role=student">Student Access</Link>
            <Link to="/login?role=investor">Investor Access</Link>
            <Link to="/login?role=admin">Admin Access</Link>
          </div>
          
          <div className="footer-section">
            <h4>Contact Information</h4>
            <p>Email: projxchange@gmail.com</p>
            <p>University Project</p>
            <p>Developed By: Sarah & Kumkum</p>
            <p>Year: 2026</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 ProjXchange | Final Year Project</p>
          <p>Developed by Sarah & Kumkum</p>
        </div>
      </div>
    </footer>
  );
}