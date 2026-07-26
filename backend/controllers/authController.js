import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { createUser, findUserByEmail, updateUserOtp, verifyUserOtp, updatePassword } from "../models/userModel.js";
import pool from "../config/db.js";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password.length >= 6;
const validatePhone = (phone) => /^[0-9]{10,15}$/.test(phone);
const validateCNIC = (cnic) => /^[0-9]{13}$/.test(cnic);

// HARDCODED ADMIN CREDENTIALS FOR SARAH & KUMKUM
const ADMIN_CREDENTIALS = {
  'admin@projxchange.com': 'PXadmin2024!'
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, cnic, role = 'student' } = req.body;

    console.log("📝 Signup attempt:", { name, email, phone, cnic, role });

    // STRONG VALIDATION - BUT KEEP ROLE SELECTION WORKING
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Name validation: Only letters and spaces, 2-50 characters
    const nameRegex = /^[A-Za-z\s]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ message: "Name should contain only letters (2-50 characters)" });
    }

    // Email validation: Proper email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address (e.g., user@example.com)" });
    }

    // Check for fake emails like .con
    const validDomains = ['com', 'org', 'net', 'edu', 'gov', 'pk'];
    const emailDomain = email.split('.').pop().toLowerCase();
    if (!validDomains.includes(emailDomain)) {
      return res.status(400).json({ message: "Please use a valid email domain (.com, .org, .net, etc.)" });
    }

    // Password validation: Minimum 6 characters
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Phone validation: Only numbers, 10-15 digits
    if (phone) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: "Phone number must contain only numbers (10-15 digits)" });
      }
    }

    // CNIC validation: Proper format (12345-1234567-1 or 1234512345671)
    if (cnic) {
      // Remove dashes for validation
      const cleanCnic = cnic.replace(/-/g, '');
      const cnicRegex = /^[0-9]{13}$/;
      if (!cnicRegex.test(cleanCnic)) {
        return res.status(400).json({ message: "CNIC must be 13 digits (with or without dashes)" });
      }
    }

    // KEEP ROLE SELECTION - WHATEVER USER SELECTS IS ACCEPTED
    const finalRole = role || 'student'; // Use selected role, default to student if empty

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered. Please use a different email." });
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Format CNIC by removing dashes for storage
    const formattedCnic = cnic ? cnic.replace(/-/g, '') : null;

    const newUser = await createUser({
      name,
      email,
      password_hash,
      phone: phone || null,
      cnic: formattedCnic,
      role: finalRole  // Use the role user selected
    });
   
    console.log("✅ User created successfully:", newUser.id, "Role:", finalRole);

    res.status(201).json({
      message: `Account created successfully as ${finalRole}! You can now login.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        cnic: formattedCnic,
        role: finalRole
      }
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
   
    if (error.code === '23505') {
      return res.status(400).json({ message: "Email already exists" });
    }
   
    res.status(500).json({
      message: "Registration failed. Please check your data and try again."
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Check if it's an admin login first
    if (ADMIN_CREDENTIALS[email]) {
      if (password === ADMIN_CREDENTIALS[email]) {
        const adminName = email === 'sarah@projxchange.com' ? 'Sarah' :
                         email === 'kumkum@projxchange.com' ? 'Kumkum' : 'Admin';
       
        const token = jwt.sign({
          id: 0, // Special ID for admin
          role: 'admin',
          email: email,
          name: adminName
        }, process.env.JWT_SECRET, { expiresIn: "24h" });

        return res.status(200).json({
          message: "Admin login successful!",
          token,
          user: {
            id: 0,
            name: adminName,
            email: email,
            role: 'admin'
          }
        });
      } else {
        return res.status(400).json({ message: "Invalid admin credentials" });
      }
    }

    // Regular user login
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({
      id: user.id, role: user.role, email: user.email, name: user.name
    }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        cnic: user.cnic || ''  // Added CNIC to login response
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(200).json({ message: "If account exists, OTP sent to email" });
    }

    const otpToken = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000);

    await updateUserOtp(user.id, otpToken, otpExpiry);

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - ProjXchange',
        html: `<div><h3>Your OTP: ${otpToken}</h3><p>Valid for 3 minutes</p></div>`
      });
      console.log("OTP sent to:", email);
    } catch (emailError) {
      console.log("OTP for testing:", otpToken);
    }

    res.status(200).json({ message: "OTP sent successfully!", email: user.email });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await verifyUserOtp(email, otp);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    res.status(200).json({ message: "OTP verified successfully", email: user.email, verified: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await verifyUserOtp(email, otp);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await updatePassword(email, password_hash);

    res.status(200).json({ message: "Password updated successfully!", success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

export const debugUserOtp = async (req, res) => {
  try {
    const { email } = req.query;
    const result = await pool.query(
      `SELECT id, email, otp_token, otp_expiry FROM users WHERE email = $1`,
      [email]
    );
    if (result.rows.length > 0) {
      res.json({ user: result.rows[0] });
    } else {
      res.json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET USER PROFILE ================= */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, name, email, phone, cnic, role, company, investment_preference, bio, created_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Format CNIC with dashes for display
    const user = result.rows[0];
    if (user.cnic && user.cnic.length === 13) {
      user.cnic = `${user.cnic.slice(0, 5)}-${user.cnic.slice(5, 12)}-${user.cnic.slice(12)}`;
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching profile" 
    });
  }
};

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
  try {
    console.log("📦 Update profile body:", req.body);

    const userId = req.user.id;
    const { name, phone, cnic, company, investment_preference, bio, currentPassword, newPassword } = req.body;

    // Validate required field
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: "Name is required" 
      });
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ 
        success: false,
        message: "Phone number must contain only numbers (10-15 digits)" 
      });
    }

    // Validate and format CNIC if provided
    let formattedCnic = null;
    if (cnic) {
      // Remove dashes for validation
      const cleanCnic = cnic.replace(/-/g, '');
      if (!validateCNIC(cleanCnic)) {
        return res.status(400).json({ 
          success: false,
          message: "CNIC must be 13 digits (with or without dashes)" 
        });
      }
      formattedCnic = cleanCnic; // Store without dashes
    }

    // Check current user data first
    const userCheck = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    let updateQuery;
    let queryParams;

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is required to change password" 
        });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, userCheck.rows[0].password_hash);
      if (!validPassword) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is incorrect" 
        });
      }

      // Validate new password
      if (!validatePassword(newPassword)) {
        return res.status(400).json({ 
          success: false,
          message: "New password must be at least 6 characters" 
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Update with password change (including new fields)
      updateQuery = `
        UPDATE users 
        SET name = $1, phone = $2, cnic = $3, company = $4, investment_preference = $5, bio = $6, password_hash = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING id, name, email, phone, cnic, role, company, investment_preference, bio, created_at
      `;
      queryParams = [name, phone || null, formattedCnic, company || null, investment_preference || null, bio || null, password_hash, userId];
    } else {
      // Update without password change (including new fields)
      updateQuery = `
        UPDATE users 
        SET name = $1, phone = $2, cnic = $3, company = $4, investment_preference = $5, bio = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING id, name, email, phone, cnic, role, company, investment_preference, bio, created_at
      `;
      queryParams = [name, phone || null, formattedCnic, company || null, investment_preference || null, bio || null, userId];
    }

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Format CNIC with dashes for response
    const updatedUser = result.rows[0];
    if (updatedUser.cnic && updatedUser.cnic.length === 13) {
      updatedUser.cnic = `${updatedUser.cnic.slice(0, 5)}-${updatedUser.cnic.slice(5, 12)}-${updatedUser.cnic.slice(12)}`;
    }

    console.log("✅ Profile updated successfully for user ID:", userId);

    res.json({
      success: true,
      message: newPassword ? "Profile and password updated successfully" : "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    
    res.status(500).json({ 
      success: false,
      message: "Server error updating profile" 
    });
  }
};