import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import API from "../api/api";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", otp: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post("/auth/forgot-password", { email: formData.email });
      setMessage(response.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post("/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp
      });
      setMessage("OTP verified! Set new password");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post("/auth/reset-password", {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      setMessage("Password reset successfully! You can now login.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Reset Password" subtitle="Recover your account">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <div className="form-group">
            <input
              type="text"
              name="otp"
              className="form-control"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <input
              type="password"
              name="newPassword"
              className="form-control"
              placeholder="New Password (min 6 characters)"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </AuthCard>
  );
}