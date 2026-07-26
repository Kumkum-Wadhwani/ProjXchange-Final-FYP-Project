import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import API from "../api/api";

export default function Signup({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cnic: "",
    role: selectedRole
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Refs for auto-focus after validation
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const phoneRef = useRef(null);
  const cnicRef = useRef(null);

  useEffect(() => {
    const roleFromState = location.state?.selectedRole;
    const roleFromStorage = localStorage.getItem('selectedRole');
    const finalRole = roleFromState || roleFromStorage || 'student';
    
    setSelectedRole(finalRole);
    setFormData(prev => ({ ...prev, role: finalRole }));
  }, [location]);

  // Field-specific validation functions
  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (!/^[A-Za-z\s]{2,50}$/.test(name.trim())) {
      return "Name should contain only letters (2-50 characters)";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address";
    }
    // Check for valid domains
    const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'edu.pk', 'szabist.pk', 'szabist.edu.pk'];
    const domain = email.split('@')[1];
    if (domain && !validDomains.some(valid => domain.includes(valid))) {
      return "Please use a valid email domain (gmail.com, edu.pk, szabist.edu.pk, etc.)";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validatePhone = (phone) => {
    if (phone && !/^[0-9]{10,15}$/.test(phone)) {
      return "Phone must contain only numbers (10-15 digits)";
    }
    return "";
  };

  const validateCNIC = (cnic) => {
    if (cnic) {
      // Remove dashes for validation
      const cleanCnic = cnic.replace(/-/g, '');
      if (!/^[0-9]{13}$/.test(cleanCnic)) {
        return "CNIC must be 13 digits (format: 12345-1234567-1 or 1234512345671)";
      }
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Validate immediately after change
    let error = "";
    switch(name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'cnic':
        error = validateCNIC(value);
        break;
      default:
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    let error = "";
    switch(name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'cnic':
        error = validateCNIC(value);
        break;
      default:
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  // CNIC auto-formatting
  const handleCNICChange = (e) => {
    let value = e.target.value.replace(/[^0-9-]/g, '');
    
    // Auto-add dashes
    if (value.length <= 5) {
      value = value;
    } else if (value.length <= 13 && !value.includes('-')) {
      value = value.replace(/(\d{5})(\d{0,7})(\d{0,1})/, '$1-$2-$3');
    }
    
    setFormData({ ...formData, cnic: value });
    
    // Clear error when user starts typing
    if (fieldErrors.cnic) {
      setFieldErrors(prev => ({ ...prev, cnic: "" }));
    }
    
    // Validate
    const error = validateCNIC(value);
    setFieldErrors(prev => ({ ...prev, cnic: error }));
  };

  const showSuccessPopupMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
  };

  // Overall form validation
  const validateForm = () => {
    const errors = {};
    
    errors.name = validateName(formData.name);
    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password);
    errors.phone = validatePhone(formData.phone);
    errors.cnic = validateCNIC(formData.cnic);
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouchedFields({
      name: true, email: true, password: true,
      phone: true, cnic: true
    });
    
    const errors = validateForm();
    const hasErrors = Object.values(errors).some(error => error);
    
    if (hasErrors) {
      setFieldErrors(errors);
      
      // Find first error field and focus it
      const firstErrorField = Object.keys(errors).find(key => errors[key]);
      if (firstErrorField) {
        const fieldRef = {
          name: nameRef,
          email: emailRef,
          password: passwordRef,
          phone: phoneRef,
          cnic: cnicRef
        }[firstErrorField];
        
        if (fieldRef && fieldRef.current) {
          fieldRef.current.focus();
        }
      }
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/signup", formData);
      
      showSuccessPopupMessage(`Account created successfully as ${response.data.user.role}! Please login with your credentials.`);
      
      // Auto-hide popup after 5 seconds and redirect
      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate('/login', { state: { selectedRole } });
      }, 5000);
      
    } catch (err) {
      // Show error message below the form (not as popup)
      setFieldErrors(prev => ({ ...prev, form: err.response?.data?.message || "Registration failed" }));
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    navigate('/login', { state: { selectedRole } });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Success Popup Notification - ONLY for successful account creation */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          minWidth: '300px',
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            ✓
          </span>
          <span style={{ flex: 1 }}>{successMessage}</span>
          <button
            onClick={handleClosePopup}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              margin: '0',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      )}

      <AuthCard 
        title={`Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account`} 
        subtitle={`Join ProjXchange as ${selectedRole}`}
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Form-level error (for registration failure) */}
          {fieldErrors.form && (
            <div className="error-message" style={{ 
              color: '#dc3545', 
              backgroundColor: '#f8d7da',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              border: '1px solid #f5c6cb',
              fontSize: '14px'
            }}>
              {fieldErrors.form}
            </div>
          )}
          
          <div className="form-group">
            <input
              ref={nameRef}
              type="text"
              name="name"
              className="form-control"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              style={{
                borderColor: touchedFields.name && fieldErrors.name ? '#dc3545' : '#ced4da'
              }}
            />
            {touchedFields.name && fieldErrors.name && (
              <div className="error-message" style={{ 
                color: '#dc3545', 
                fontSize: '14px',
                marginTop: '5px'
              }}>
                {fieldErrors.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <input
              ref={emailRef}
              type="email"
              name="email"
              className="form-control"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              style={{
                borderColor: touchedFields.email && fieldErrors.email ? '#dc3545' : '#ced4da'
              }}
            />
            {touchedFields.email && fieldErrors.email && (
              <div className="error-message" style={{ 
                color: '#dc3545', 
                fontSize: '14px',
                marginTop: '5px'
              }}>
                {fieldErrors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <input
              ref={passwordRef}
              type="password"
              name="password"
              className="form-control"
              placeholder="Password (minimum 6 characters)"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              style={{
                borderColor: touchedFields.password && fieldErrors.password ? '#dc3545' : '#ced4da'
              }}
            />
            {touchedFields.password && fieldErrors.password && (
              <div className="error-message" style={{ 
                color: '#dc3545', 
                fontSize: '14px',
                marginTop: '5px'
              }}>
                {fieldErrors.password}
              </div>
            )}
          </div>

          <div className="form-group">
            <input
              ref={phoneRef}
              type="tel"
              name="phone"
              className="form-control"
              placeholder="Phone Number (optional)"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              pattern="[0-9]*"
              inputMode="numeric"
              style={{
                borderColor: touchedFields.phone && fieldErrors.phone ? '#dc3545' : '#ced4da'
              }}
            />
            {touchedFields.phone && fieldErrors.phone && (
              <div className="error-message" style={{ 
                color: '#dc3545', 
                fontSize: '14px',
                marginTop: '5px'
              }}>
                {fieldErrors.phone}
              </div>
            )}
          </div>

          <div className="form-group">
            <input
              ref={cnicRef}
              type="text"
              name="cnic"
              className="form-control"
              placeholder="CNIC (optional)"
              value={formData.cnic}
              onChange={handleCNICChange}
              onBlur={handleBlur}
              maxLength="15"
              pattern="[0-9-]*"
              inputMode="numeric"
              style={{
                borderColor: touchedFields.cnic && fieldErrors.cnic ? '#dc3545' : '#ced4da'
              }}
            />
            {touchedFields.cnic && fieldErrors.cnic && (
              <div className="error-message" style={{ 
                color: '#dc3545', 
                fontSize: '14px',
                marginTop: '5px'
              }}>
                {fieldErrors.cnic}
              </div>
            )}
          </div>

          <input type="hidden" name="role" value={selectedRole} />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account`}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>
              Already have an account? <Link to="/login" state={{ selectedRole }}>Sign In</Link>
            </p>
            
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                Want to create account as different role?
              </p>
              <Link to="/">← Back to Role Selection</Link>
            </div>
          </div>
        </form>
      </AuthCard>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Prevent number spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
        
        .form-control:focus {
          border-color: #4CAF50;
          box-shadow: 0 0 0 0.2rem rgba(76, 175, 80, 0.25);
        }
        
        .form-control.is-invalid:focus {
          border-color: #dc3545;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
      `}</style>
    </div>
  );
}