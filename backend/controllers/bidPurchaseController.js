import stripe from '../config/stripe.js';
import pool from '../config/db.js';
import { addBidCredits } from '../models/userModel.js';

// Updated PKR pricing: 1 bid = 150 PKR, 2 bids = 300 PKR, 4 bids = 600 PKR, 6 bids = 900 PKR
export const BID_PACKAGES = [
  { id: 1, bids: 1, price: 150 },   // 1 bid for 150 PKR
  { id: 2, bids: 2, price: 300 },   // 2 bids for 300 PKR
  { id: 3, bids: 4, price: 600 },   // 4 bids for 600 PKR
  { id: 4, bids: 6, price: 900 }    // 6 bids for 900 PKR
];

export const createBidPackagePaymentIntent = async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;
    const selectedPackage = BID_PACKAGES.find(pkg => pkg.id === parseInt(packageId));
    if (!selectedPackage) return res.status(400).json({ success: false, message: "Invalid package" });

    // Stripe minimum for PKR is 50 PKR, all our packages are above that
    if (selectedPackage.price < 50) {
      return res.status(400).json({ success: false, message: "Package amount must be at least ₨ 50" });
    }

    // Convert rupees to paisa (1 PKR = 100 paisa)
    const amountInPaisa = Math.round(selectedPackage.price * 100);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: 'pkr',   // Pakistani Rupee
      metadata: {
        userId: userId.toString(),
        packageId: packageId.toString(),
        bids: selectedPackage.bids.toString(),
        type: 'bid_purchase'
      }
    });
    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmBidPurchase = async (userId, packageId, stripePaymentIntentId) => {
  const selectedPackage = BID_PACKAGES.find(pkg => pkg.id === parseInt(packageId));
  if (!selectedPackage) throw new Error("Invalid package");
  const newCredits = await addBidCredits(userId, selectedPackage.bids);
  await pool.query(
    `INSERT INTO bid_transactions (user_id, amount, price, stripe_payment_intent_id, status)
     VALUES ($1, $2, $3, $4, 'completed')`,
    [userId, selectedPackage.bids, selectedPackage.price, stripePaymentIntentId]
  );
  return newCredits;
};