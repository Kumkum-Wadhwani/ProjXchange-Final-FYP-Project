import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="logo-link">
            <div className="logo-img">PX</div>
            <span className="logo-text">ProjXchange</span>
          </Link>
          
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/welcome" className="nav-link">Welcome</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/services" className="nav-link">Services</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/login" className="nav-link">Login</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}