import express from 'express';
import {
  createPaymentIntent,
  handlePaymentSuccess,
  handleStripeWebhook,
  createBidPaymentIntent,
  confirmBidPayment,
  getPaymentHistory,
  checkAccess,
  confirmPaymentReceipt,
  getPendingStudentConfirmations   // ← ADD THIS IMPORT  
} from '../controllers/paymentController.js';
import { createBidPackagePaymentIntent } from '../controllers/bidPurchaseController.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook (raw body)
router.post('/webhook', handleStripeWebhook);

// Existing payment routes (for bid packs, etc.)
router.post('/create-payment-intent', authMiddleware, authorizeRoles('investor'), createPaymentIntent);
router.post('/payment-success', authMiddleware, authorizeRoles('investor'), handlePaymentSuccess);
router.post('/create-bid-payment-intent', authMiddleware, authorizeRoles('investor'), createBidPackagePaymentIntent);

// NEW: Payment for accepted bids
router.post('/bid/:bidId/pay', authMiddleware, authorizeRoles('investor'), createBidPaymentIntent);
router.post('/bid/confirm-payment', authMiddleware, authorizeRoles('investor'), confirmBidPayment);
router.get('/history', authMiddleware, authorizeRoles('investor'), getPaymentHistory);
router.get('/bid/:bidId/access', authMiddleware, authorizeRoles('investor'), checkAccess);
// paymentRoutes.js
router.post('/confirm-receipt/:paymentId', authMiddleware, authorizeRoles('student'), confirmPaymentReceipt);
router.get('/student/pending-confirmations', authMiddleware, authorizeRoles('student'), getPendingStudentConfirmations);  // ← ADD THIS LINE
export default router;