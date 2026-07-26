import stripe from '../config/stripe.js';
import pool from '../config/db.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const createBidPaymentIntent = async (req, res) => {
  try {
    const { bidId } = req.params;
    const investorId = req.user.id;

    const bidResult = await pool.query(`
      SELECT b.amount, b.investor_id, p.user_id as student_id, p.title as project_title
      FROM bids b
      JOIN projects p ON b.project_id = p.id
      WHERE b.id = $1 
        AND b.status = 'approved' 
        AND (b.payment_status IS NULL OR b.payment_status != 'completed')
    `, [bidId]);

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found, not approved, or already paid' });
    }

    const bid = bidResult.rows[0];
    if (bid.investor_id !== investorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Stripe minimum is $0.50 USD → approx 140 PKR
    const MIN_AMOUNT_PKR = 140;
    if (bid.amount < MIN_AMOUNT_PKR) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum payment is ₨ ${MIN_AMOUNT_PKR}. Your bid is ₨ ${bid.amount}. Please ask the student to place a higher bid.` 
      });
    }

    // Convert to paisa for Stripe (1 PKR = 100 paisa)
    const amountInPaisa = Math.round(bid.amount * 100);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: 'pkr',
      metadata: {
        bid_id: bidId,
        investor_id: investorId,
        student_id: bid.student_id,
        project_title: bid.project_title
      },
      automatic_payment_methods: { enabled: true }
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES users(id),
        student_id INTEGER REFERENCES users(id),
        bid_id INTEGER REFERENCES bids(id),
        amount DECIMAL(10,2),
        stripe_payment_intent VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        type VARCHAR(50) DEFAULT 'bid_acceptance',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS student_confirmed BOOLEAN DEFAULT FALSE;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
    `);

    await pool.query(
      `INSERT INTO payments (investor_id, student_id, bid_id, amount, stripe_payment_intent, status, type)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'bid_acceptance')`,
      [investorId, bid.student_id, bidId, bid.amount, paymentIntent.id]
    );

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('❌ createBidPaymentIntent error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create payment intent' });
  }
};

export const confirmBidPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const investorId = req.user.id;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }

    const bidId = parseInt(paymentIntent.metadata.bid_id);
    const studentId = parseInt(paymentIntent.metadata.student_id);
    const amount = paymentIntent.amount / 100; // total paid by investor

    // Calculate 5% platform commission
    const commission = amount * 0.05;
    const netAmount = amount - commission;

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update bid payment status
      await client.query(
        `UPDATE bids SET payment_status = 'completed', paid_at = NOW() WHERE id = $1`,
        [bidId]
      );

      // Update payment record
      await client.query(
        `UPDATE payments SET status = 'completed' WHERE stripe_payment_intent = $1`,
        [paymentIntentId]
      );

      // Insert transaction record for platform earnings
      await client.query(
        `INSERT INTO transactions (bid_id, amount, commission, net_amount, status, stripe_payment_intent_id, created_at)
         VALUES ($1, $2, $3, $4, 'completed', $5, NOW())`,
        [bidId, amount, commission, netAmount, paymentIntentId]
      );

      await client.query('COMMIT');

      // Send email to student (existing code remains)
      const studentResult = await pool.query(`SELECT name, email FROM users WHERE id = $1`, [studentId]);
      const investorResult = await pool.query(`SELECT name, email FROM users WHERE id = $1`, [investorId]);
      const projectTitle = paymentIntent.metadata.project_title;

      if (studentResult.rows.length > 0) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: studentResult.rows[0].email,
          subject: `Payment received for "${projectTitle}"`,
          html: `
            <h3>Payment Confirmation</h3>
            <p>Dear ${studentResult.rows[0].name},</p>
            <p>You have received a payment of <strong>₨ ${amount.toLocaleString()}</strong> from investor <strong>${investorResult.rows[0].name}</strong> (${investorResult.rows[0].email}) for your project <strong>"${projectTitle}"</strong>.</p>
            <p><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Platform Fee (5%):</strong> ₨ ${commission.toLocaleString()}</p>
            <p><strong>Net Amount to you:</strong> ₨ ${netAmount.toLocaleString()}</p>
            <p>Please log in to your student dashboard and click the <strong>OK button</strong> to confirm that you have received this payment. After that, the investor can download your files.</p>
            <p>Thank you for using ProjXchange!</p>
          `
        });
      }

      res.json({ success: true, message: 'Payment confirmed and student notified' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ confirmBidPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm payment' });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const investorId = req.user.id;

    // Old bid pack purchases (from `bid_pack_purchases` table)
    const oldPackPurchases = await pool.query(`
      SELECT id, created_at as date, pack_size as amount, 'bid_purchase' as type, 'completed' as status,
             CONCAT('Purchased ', pack_size, ' bid credits') as description
      FROM bid_pack_purchases
      WHERE user_id = $1 AND status = 'completed'
    `, [investorId]);

    // NEW bid pack purchases (from `bid_transactions` table) – FIXED
    const newPackPurchases = await pool.query(`
      SELECT id, created_at as date, price as amount, 'bid_purchase' as type, 'completed' as status,
             CONCAT('Purchased ', amount, ' bid credits (₨ ', price, ')') as description
      FROM bid_transactions
      WHERE user_id = $1 AND status = 'completed'
    `, [investorId]);

    // Project payments (from `payments` table)
    const projectPayments = await pool.query(`
      SELECT p.id, p.created_at as date, p.amount, 'bid_acceptance' as type, p.status,
             CONCAT('Payment for project: ', pr.title) as description
      FROM payments p
      JOIN bids b ON p.bid_id = b.id
      JOIN projects pr ON b.project_id = pr.id
      WHERE p.investor_id = $1 AND p.status = 'completed'
    `, [investorId]);

    // Combine all transactions
    let allTransactions = [...oldPackPurchases.rows, ...newPackPurchases.rows, ...projectPayments.rows];
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    allTransactions = allTransactions.map(tx => ({
      ...tx,
      formatted_date: new Date(tx.date).toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      formatted_amount: `₨ ${parseFloat(tx.amount).toLocaleString()}`
    }));

    res.json({ success: true, transactions: allTransactions });
  } catch (error) {
    console.error('❌ getPaymentHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
};

export const checkAccess = async (req, res) => {
  try {
    const { bidId } = req.params;
    const investorId = req.user.id;

    const result = await pool.query(
      `SELECT b.payment_status, COALESCE(p.student_confirmed, false) as student_confirmed
       FROM bids b
       LEFT JOIN payments p ON b.id = p.bid_id
       WHERE b.id = $1 AND b.investor_id = $2`,
      [bidId, investorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const hasAccess = result.rows[0].payment_status === 'completed' && result.rows[0].student_confirmed === true;
    res.json({ success: true, hasAccess });
  } catch (error) {
    console.error('❌ checkAccess error:', error);
    res.status(500).json({ success: false, message: 'Failed to check access' });
  }
};

export const confirmPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(
      `UPDATE payments 
       SET student_confirmed = TRUE, confirmed_at = NOW() 
       WHERE id = $1 AND student_id = $2 AND status = 'completed' AND student_confirmed = FALSE
       RETURNING id, student_confirmed, confirmed_at, investor_id, amount, bid_id`,
      [paymentId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found, already confirmed, or not completed' });
    }

    const payment = result.rows[0];
    const investorRes = await pool.query(`SELECT name, email FROM users WHERE id = $1`, [payment.investor_id]);
    const bidRes = await pool.query(`SELECT project_title FROM bids WHERE id = $1`, [payment.bid_id]);
    
    if (investorRes.rows.length > 0 && bidRes.rows.length > 0) {
      const investor = investorRes.rows[0];
      const projectTitle = bidRes.rows[0].project_title;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: investor.email,
        subject: `Student confirmed receipt for "${projectTitle}"`,
        html: `<h3>Payment Receipt Confirmed</h3><p>Dear ${investor.name},</p><p>The student has confirmed that they received your payment of <strong>₨ ${payment.amount.toLocaleString()}</strong> for project <strong>"${projectTitle}"</strong>.</p><p>You can now download the project files from your investor dashboard.</p><p>Thank you for using ProjXchange!</p>`
      });
    }

    res.json({ success: true, message: 'Payment receipt confirmed successfully' });
  } catch (error) {
    console.error('❌ confirmPaymentReceipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm payment receipt' });
  }
};

export const getPendingStudentConfirmations = async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await pool.query(`
      SELECT p.id, p.amount, p.created_at, b.project_title, u.name as investor_name, u.email as investor_email
      FROM payments p
      JOIN bids b ON p.bid_id = b.id
      JOIN users u ON p.investor_id = u.id
      WHERE p.student_id = $1 AND p.status = 'completed' AND p.student_confirmed = FALSE
      ORDER BY p.created_at DESC
    `, [studentId]);
    const payments = result.rows.map(p => ({ ...p, formatted_amount: `₨ ${parseFloat(p.amount).toLocaleString()}` }));
    res.json({ success: true, payments });
  } catch (error) {
    console.error('❌ getPendingStudentConfirmations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending confirmations' });
  }
};

// Legacy functions (unchanged)
export const createPaymentIntent = async (req, res) => {
  try {
    const { bid_id, amount, project_id, investor_id, student_id } = req.body;
    if (!bid_id || !amount || !project_id || !investor_id || !student_id) {
      return res.status(400).json({ message: 'All payment details are required' });
    }
    
    // Minimum PKR check (now 140 to match Stripe requirement)
    if (amount < 140) {
      return res.status(400).json({ message: 'Minimum payment amount is ₨ 140' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'pkr',
      metadata: { 
        bid_id: bid_id.toString(), 
        project_id: project_id.toString(), 
        investor_id: investor_id.toString(), 
        student_id: student_id.toString() 
      },
      automatic_payment_methods: { enabled: true }
    });
    await pool.query(`INSERT INTO payments (payment_intent_id, user_id, project_id, bid_id, amount, status) VALUES ($1, $2, $3, $4, $5, 'pending')`, 
      [paymentIntent.id, investor_id, project_id, bid_id, amount]);
    res.status(200).json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error('❌ createPaymentIntent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
};

export const handlePaymentSuccess = async (req, res) => {
  const { paymentIntentId, bid_id } = req.body;
  const client = await pool.connect();
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') return res.status(400).json({ message: 'Payment not completed' });
    const amount = paymentIntent.amount / 100;
    const commission = amount * 0.05;
    const net_amount = amount - commission;
    await client.query('BEGIN');
    await client.query(`UPDATE payments SET status='succeeded', updated_at=NOW() WHERE payment_intent_id=$1`, [paymentIntentId]);
    await client.query(`UPDATE bids SET status='approved', is_accepted=true, accepted_at=NOW() WHERE id=$1`, [bid_id]);
    await client.query(`UPDATE projects SET status='funded', updated_at=NOW() WHERE id=$1`, [paymentIntent.metadata.project_id]);
    await client.query(`INSERT INTO transactions (bid_id, amount, commission, net_amount, status, stripe_payment_intent_id) VALUES ($1, $2, $3, $4, 'completed', $5)`, [bid_id, amount, commission, net_amount, paymentIntentId]);
    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Payment successful' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ handlePaymentSuccess error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  } finally { client.release(); }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  const paymentIntent = event.data.object;
  if (event.type === 'payment_intent.succeeded') {
    await pool.query(`UPDATE payments SET status='succeeded', updated_at=NOW() WHERE payment_intent_id=$1`, [paymentIntent.id]);
  }
  if (event.type === 'payment_intent.payment_failed') {
    await pool.query(`UPDATE payments SET status='failed', updated_at=NOW() WHERE payment_intent_id=$1`, [paymentIntent.id]);
  }
  res.json({ received: true });
};