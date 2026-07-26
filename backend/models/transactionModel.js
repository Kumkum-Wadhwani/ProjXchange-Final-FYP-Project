import pool from '../config/db.js';

export const createTransaction = async ({
  bid_id,
  amount,
  commission,
  net_amount,
  stripe_payment_intent_id
}) => {
  const result = await pool.query(
    `
    INSERT INTO transactions
    (bid_id, amount, commission, net_amount, status, stripe_payment_intent_id)
    VALUES ($1, $2, $3, $4, 'completed', $5)
    RETURNING *
    `,
    [bid_id, amount, commission, net_amount, stripe_payment_intent_id]
  );

  return result.rows[0];
};

export const getAllTransactions = async () => {
  const result = await pool.query(`
    SELECT t.*, b.project_id
    FROM transactions t
    LEFT JOIN bids b ON t.bid_id = b.id
    ORDER BY t.created_at DESC
  `);
  return result.rows;
};

export const getTotalEarnings = async () => {
  const result = await pool.query(`
    SELECT COALESCE(SUM(commission), 0) AS total_earnings
    FROM transactions
    WHERE status='completed'
  `);
  return Number(result.rows[0].total_earnings);
};
