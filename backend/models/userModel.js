import pool from "../config/db.js";

export const createUser = async ({ name, email, password_hash, phone = null, cnic = null, role = 'student' }) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone, cnic, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, phone, cnic`,
    [name, email, password_hash, phone, cnic, role]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, role, phone, cnic FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const updateUserOtp = async (userId, otpToken, otpExpiry) => {
  const result = await pool.query(
    `UPDATE users SET otp_token = $1, otp_expiry = $2 WHERE id = $3 RETURNING id, email, otp_token`,
    [otpToken, otpExpiry, userId]
  );
  return result.rows[0];
};

export const verifyUserOtp = async (email, otpToken) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND otp_token = $2 AND otp_expiry > NOW()`,
    [email, otpToken]
  );
  return result.rows[0] || null;
};

export const updatePassword = async (email, password_hash) => {
  const result = await pool.query(
    `UPDATE users SET password_hash = $1, otp_token = NULL, otp_expiry = NULL WHERE email = $2 RETURNING id, email`,
    [password_hash, email]
  );
  return result.rows[0];
};

export const updateUserProfile = async (userId, { name, phone }) => {
  const result = await pool.query(
    `UPDATE users 
     SET name = $1, phone = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, email, phone, role`,
    [name, phone || null, userId]
  );
  return result.rows[0];
};

export const getUserProfile = async (userId) => {
  const result = await pool.query(
    `SELECT id, name, email, phone, role, created_at, updated_at 
     FROM users 
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0];
};

// ---------- Bid credits & notifications ----------
export const getUserBidCredits = async (userId) => {
  const result = await pool.query('SELECT bid_credits FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.bid_credits || 0;
};

export const deductBidCredit = async (userId) => {
  const result = await pool.query(
    `UPDATE users SET bid_credits = bid_credits - 1 WHERE id = $1 AND bid_credits > 0 RETURNING bid_credits`,
    [userId]
  );
  if (result.rows.length === 0) throw new Error('Insufficient bid credits');
  return result.rows[0].bid_credits;
};

export const addBidCredits = async (userId, credits) => {
  const result = await pool.query(
    `UPDATE users SET bid_credits = bid_credits + $1 WHERE id = $2 RETURNING bid_credits`,
    [credits, userId]
  );
  return result.rows[0].bid_credits;
};

export const createNotification = async ({ userId, type, title, message, relatedId = null }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, related_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, message, relatedId]
  );
  return result.rows[0];
};