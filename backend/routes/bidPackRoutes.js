import express from 'express';
import {
  createBidPackagePaymentIntent,
  confirmBidPurchase,
  BID_PACKAGES
} from '../controllers/bidPurchaseController.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get available bid packs
router.get('/packs', authMiddleware, authorizeRoles('investor'), (req, res) => {
  res.json({ success: true, packs: BID_PACKAGES });
});

router.post('/create-payment-intent', authMiddleware, authorizeRoles('investor'), createBidPackagePaymentIntent);
router.post('/confirm', authMiddleware, authorizeRoles('investor'), async (req, res) => {
  try {
    const { paymentIntentId, packageId } = req.body;
    const userId = req.user.id;
    const newCredits = await confirmBidPurchase(userId, packageId, paymentIntentId);
    res.json({ success: true, message: `Successfully added ${newCredits} bid credits!`, credits: newCredits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;