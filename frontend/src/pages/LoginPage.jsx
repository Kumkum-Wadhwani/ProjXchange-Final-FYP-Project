import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import API from "../api/api";

export default function Login({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get role from Welcome page or localStorage
    const roleFromState = location.state?.selectedRole;
    const roleFromStorage = localStorage.getItem('selectedRole');
    const finalRole = roleFromState || roleFromStorage || 'student';
    
    setSelectedRole(finalRole);
    localStorage.setItem('selectedRole', finalRole); // Ensure it's saved
    
    // Clear any existing form data when component mounts
    setFormData({ email: "", password: "" });
    setError("");
    
    // Clear any potential browser autofill
    document.querySelectorAll('input').forEach(input => {
      input.value = '';
    });
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate form
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/auth/login", formData);
      
      console.log("Login successful - User role:", response.data.user.role);
      
      // Clear form data after successful login
      setFormData({ email: "", password: "" });
      
      // Call onLogin to set user in App.jsx and redirect to correct dashboard
      onLogin(response.data.user, response.data.token);
      
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      // Clear password on error for security
      setFormData(prev => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    // Navigate to signup with the selected role
    navigate('/signup', { state: { selectedRole } });
  };

  const clearForm = () => {
    setFormData({ email: "", password: "" });
    setError("");
    // Force clear all input values
    document.querySelectorAll('input[type="email"]').forEach(input => input.value = '');
    document.querySelectorAll('input[type="password"]').forEach(input => input.value = '');
  };

  return (
    <AuthCard 
      title={`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`} 
      subtitle={`Sign in to your ${selectedRole} account`}
    >
      {/* Clear Form Button */}
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button 
          type="button" 
          onClick={clearForm}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Clear Form
        </button>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        {error && (
          <div className="error-message" style={{ 
            color: '#dc3545', 
            backgroundColor: '#f8d7da',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}
        
        <div className="form-group">
          <input
            type="email"
            name="email"
            className="form-control"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="new-email" // Prevent autofill
            key="email-input" // Add key to force re-render
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            className="form-control"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password" // Prevent autofill
            key="password-input" // Add key to force re-render
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ width: '100%', padding: '12px' }}
        >
          {loading ? "Signing In..." : `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/forgot-password">Forgot Password?</Link>
          <p style={{ marginTop: '15px' }}>
            Don't have an account?{" "}
            <Link 
              to="/signup" 
              state={{ selectedRole }}
              onClick={(e) => {
                e.preventDefault();
                navigate('/signup', { state: { selectedRole } });
              }}
            >
              Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
            </Link>
          </p>
          
          {/* Change Role Section */}
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
              Want to login as different role?
            </p>
            <Link 
              to="/" 
              onClick={() => {
                // Clear form when going back to role selection
                setFormData({ email: "", password: "" });
                localStorage.removeItem('selectedRole');
              }}
            >
              ← Back to Role Selection
            </Link>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}