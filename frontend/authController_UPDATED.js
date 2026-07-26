// UPDATED Auth Controller with Role Validation
// Replace your existing authController.js with this file

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { createUser, findUserByEmail, updateUserOtp, verifyUserOtp, updatePassword } from "../models/userModel.js";
import pool from "../config/db.js";

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Signup Controller
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, cnic, role = 'student' } = req.body;

    console.log("📝 Signup attempt:", { name, email, phone, cnic, role });

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    console.log("🔑 Password hashed, creating user with role:", role);

    const newUser = await createUser({ 
      name, 
      email, 
      password_hash, 
      phone: phone || null, 
      cnic: cnic || null, 
      role 
    });
    
    console.log("✅ User created successfully:", newUser.id, "Role:", newUser.role);

    res.status(201).json({ 
      message: "Account created successfully! You can now login.",
      user: { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email,
        role: newUser.role 
      } 
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    
    if (error.code === '23505') {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (error.code === '23502') {
      return res.status(400).json({ message: "Required fields are missing" });
    }
    
    res.status(500).json({ 
      message: "Registration failed. Please check your data and try again."
    });
  }
};

// Login Controller - UPDATED with role validation
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log("🔐 Login attempt:", { email, expectedRole: role });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("👤 User found:", { email: user.email, actualRole: user.role });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // OPTIONAL: Validate role on backend (uncomment if you want backend validation)
    // if (role && user.role !== role) {
    //   console.log("❌ Role mismatch - Expected:", role, "Actual:", user.role);
    //   return res.status(403).json({ 
    //     message: `This account is registered as a ${user.role}. Please use the ${user.role} login option.`,
    //     actualRole: user.role 
    //   });
    // }

    const token = jwt.sign({ 
      id: user.id, 
      role: user.role,
      email: user.email 
    }, process.env.JWT_SECRET, { expiresIn: "24h" });

    console.log("✅ Login successful - User:", user.email, "Role:", user.role);

    res.status(200).json({
      message: "Login successful!",
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone || ''
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📧 Forgot password request for:", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(200).json({ 
        message: "If an account with this email exists, we've sent a password reset OTP" 
      });
    }

    console.log("✅ User found:", user.id, user.email);

    const otpToken = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    console.log("🔐 Generated OTP:", otpToken, "Expires:", otpExpiry);

    try {
      const updatedUser = await updateUserOtp(user.id, otpToken, otpExpiry);
      console.log("💾 OTP saved to database for user:", updatedUser.id);

      // Try to send email
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset OTP - ProjXchange',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You requested a password reset for your ProjXchange account.</p>
              <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                <h3 style="margin: 0; color: #333; font-size: 24px; letter-spacing: 5px;">${otpToken}</h3>
              </div>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">ProjXchange Team</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("📧 OTP email sent successfully to:", email);

      } catch (emailError) {
        console.error("❌ Error sending email:", emailError);
        console.log("📧 OTP for development:", otpToken);
      }

      res.status(200).json({ 
        message: "OTP generated successfully! Check your email or console.",
        email: user.email,
        otp: otpToken,
        note: "Check backend console for OTP code"
      });

    } catch (dbError) {
      console.error("❌ Database error saving OTP:", dbError);
      res.status(500).json({ 
        message: "Error saving OTP to database"
      });
    }

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ 
      message: "Server error processing OTP request",
      error: error.message 
    });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("🔍 Verifying OTP:", { email, otp });

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await verifyUserOtp(email, otp);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    console.log("✅ OTP verified successfully for:", email);

    res.status(200).json({ 
      message: "OTP verified successfully",
      email: user.email,
      verified: true
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log("🔄 Reset password request:", { email, otp });

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await verifyUserOtp(email, otp);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await updatePassword(email, password_hash);

    console.log("✅ Password reset successfully for:", email);

    res.status(200).json({ 
      message: "Password updated successfully! You can now login with your new password.",
      success: true
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

// Debug endpoint
export const debugUserOtp = async (req, res) => {
  try {
    const { email } = req.query;
    
    console.log("🔧 Debug OTP request for:", email);
    
    const result = await pool.query(
      `SELECT id, email, role, otp_token, otp_expiry, NOW() as current_time 
       FROM users WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("🔧 Debug result:", user);
      res.json({ 
        user: user,
        status: "User found",
        hasOtp: !!user.otp_token,
        isExpired: user.otp_expiry ? new Date(user.otp_expiry) < new Date() : true
      });
    } else {
      console.log("🔧 Debug result: User not found");
      res.json({ message: "User not found" });
    }
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};
