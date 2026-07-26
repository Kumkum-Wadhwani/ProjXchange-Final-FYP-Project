import express from "express";
import { 
  signup, 
  login, 
  forgotPassword, 
  verifyOtp, 
  resetPassword, 
  debugUserOtp,
  getProfile,
  updateProfile
} from "../controllers/authController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.get("/debug-otp", debugUserOtp);

// ✅ Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);  // Changed from /update-profile to /profile

export default router;