import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import './AuthPages.css';

export default function ResetPassword() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Pre-fill email and OTP if coming from verify OTP
    if (location.state?.email) {
      setFormData(prev => ({ 
        ...prev, 
        email: location.state.email,
        otp: location.state.otp || '' 
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.otp || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log("🔄 Resetting password for:", formData.email);
      
      const response = await API.post('/api/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      
      console.log("✅ Password reset response:", response.data);
      
      setMessage(response.data.message || 'Password reset successfully!');
      
      // Redirect to login after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('❌ Reset password error:', error);
      setError(error.response?.data?.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-header">
          <div className="logo-auth">
            <span className="logo-text">PX</span>
          </div>
          <h1>Set New Password</h1>
          <p>Enter OTP and new password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {message}
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="otp"
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChange={handleChange}
              required
              className="form-input"
              maxLength="6"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password (min. 6 characters)"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={`auth-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-links">
          <button onClick={() => navigate('/verify-otp')} className="back-button">
            ← Back to OTP Verification
          </button>
        </div>
      </div>
    </div>
  );
}