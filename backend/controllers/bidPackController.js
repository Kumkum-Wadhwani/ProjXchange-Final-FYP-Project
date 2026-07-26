import Stripe from 'stripe';
import pool from '../config/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const BID_PACKS = {
  4: { amount: 1999, price_cents: 1999 },  
  8: { amount: 3499, price_cents: 3499 }    
};

// Get available bid packs
export const getBidPacks = async (req, res) => {
  res.json({
    success: true,
    packs: [
      { size: 4, price: 19.99, priceCents: 1999 },
      { size: 8, price: 34.99, priceCents: 3499 }
    ]
  });
};

// Create Stripe Payment Intent
export const createBidPackPaymentIntent = async (req, res) => {
  try {
    const { packSize } = req.body;
    const investorId = req.user.id;

    if (!BID_PACKS[packSize]) {
      return res.status(400).json({ success: false, message: 'Invalid pack size' });
    }

    const pack = BID_PACKS[packSize];
    const amount = pack.price_cents;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: {
        investor_id: investorId,
        pack_size: packSize,
        type: 'bid_pack'
      }
    });

    // Store pending purchase
    await pool.query(
      `INSERT INTO bid_pack_purchases (user_id, pack_size, amount, stripe_payment_intent, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [investorId, packSize, amount / 100, paymentIntent.id]
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      packSize,
      amount: amount / 100
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment. Check Stripe keys.' });
  }
};

// Confirm purchase after successful payment
export const confirmBidPackPurchase = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const investorId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }

    const packSize = parseInt(paymentIntent.metadata.pack_size);
    if (!packSize) {
      return res.status(400).json({ success: false, message: 'Invalid pack size' });
    }

    // Update purchase record
    await pool.query(
      `UPDATE bid_pack_purchases 
       SET status = 'completed' 
       WHERE stripe_payment_intent = $1 AND user_id = $2`,
      [paymentIntentId, investorId]
    );

    // Add paid bids to user (function from projectModel.js)
    const result = await pool.query(
      `UPDATE users SET paid_bids_remaining = paid_bids_remaining + $1 WHERE id = $2 RETURNING paid_bids_remaining`,
      [packSize, investorId]
    );

    const newPaidBids = result.rows[0].paid_bids_remaining;

    res.json({
      success: true,
      message: `Successfully purchased ${packSize} bids!`,
      paidBidsRemaining: newPaidBids
    });
  } catch (error) {
    console.error('Confirm purchase error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm purchase' });
  }
};