import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/deliverables/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, 'deliverable-' + uniqueSuffix + '-' + safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/html', 'text/css', 'application/javascript',
    'application/x-python-code', 'application/json', 'application/xml'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx', '.txt', '.html', '.css', '.js', '.py', '.json', '.xml'];
  
  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed: zip, pdf, doc, txt, code files'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});

const checkBidAccess = async (bidId, userId, userRole) => {
  const query = `
    SELECT b.id, b.status, p.user_id as student_id, b.investor_id
    FROM bids b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = $1
  `;
  const result = await pool.query(query, [bidId]);
  if (result.rows.length === 0) return { error: 'Bid not found' };
  const bid = result.rows[0];
  if (bid.status !== 'approved') return { error: 'Bid not approved yet' };
  if (userRole === 'student' && bid.student_id !== userId) return { error: 'Not authorized' };
  if (userRole === 'investor' && bid.investor_id !== userId) return { error: 'Not authorized' };
  return { bid };
};

export const uploadDeliverable = async (req, res) => {
  try {
    const { bidId } = req.params;
    const studentId = req.user.id;
    const { description } = req.body;

    const auth = await checkBidAccess(bidId, studentId, 'student');
    if (auth.error) return res.status(403).json({ success: false, message: auth.error });
    const { bid } = auth;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await pool.query(
      `INSERT INTO project_deliverables 
       (bid_id, student_id, investor_id, file_name, file_path, file_size, file_type, description, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        bidId,
        studentId,
        bid.investor_id,
        req.file.originalname,
        req.file.path.replace(/\\/g, '/'),
        req.file.size,
        req.file.mimetype,
        description || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      deliverable: result.rows[0]
    });
  } catch (error) {
    console.error('Upload deliverable error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};

export const getStudentDeliverables = async (req, res) => {
  try {
    const { bidId } = req.params;
    const studentId = req.user.id;

    const auth = await checkBidAccess(bidId, studentId, 'student');
    if (auth.error) return res.status(403).json({ success: false, message: auth.error });

    const result = await pool.query(
      `SELECT id, file_name, file_size, file_type, description, uploaded_at
       FROM project_deliverables
       WHERE bid_id = $1
       ORDER BY uploaded_at DESC`,
      [bidId]
    );

    res.json({ success: true, deliverables: result.rows });
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deliverables' });
  }
};

export const deleteDeliverable = async (req, res) => {
  try {
    const { deliverableId } = req.params;
    const studentId = req.user.id;

    const deliverable = await pool.query(
      `SELECT d.*, b.id as bid_id FROM project_deliverables d
       JOIN bids b ON d.bid_id = b.id
       WHERE d.id = $1 AND d.student_id = $2`,
      [deliverableId, studentId]
    );
    if (deliverable.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found or not authorized' });
    }

    try {
      const filePath = deliverable.rows[0].file_path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) { console.error('File deletion error:', err); }

    await pool.query('DELETE FROM project_deliverables WHERE id = $1', [deliverableId]);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
};

export const getInvestorDeliverables = async (req, res) => {
  try {
    const { bidId } = req.params;
    const investorId = req.user.id;

    const auth = await checkBidAccess(bidId, investorId, 'investor');
    if (auth.error) return res.status(403).json({ success: false, message: auth.error });

    const result = await pool.query(
      `SELECT id, file_name, file_size, file_type, description, uploaded_at
       FROM project_deliverables
       WHERE bid_id = $1
       ORDER BY uploaded_at DESC`,
      [bidId]
    );

    res.json({ success: true, deliverables: result.rows });
  } catch (error) {
    console.error('Get investor deliverables error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deliverables' });
  }
};

// ==================== FIXED: DOWNLOAD WITH student_confirmed CHECK ====================
export const downloadInvestorFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const investorId = req.user.id;

    // Join with payments to get student_confirmed status
    const fileResult = await pool.query(`
      SELECT d.*, 
             b.investor_id, 
             b.payment_status,
             COALESCE(p.student_confirmed, false) as student_confirmed
      FROM project_deliverables d
      JOIN bids b ON d.bid_id = b.id
      LEFT JOIN payments p ON b.id = p.bid_id
      WHERE d.id = $1
    `, [fileId]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Verify investor owns the bid
    if (file.investor_id !== investorId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check both payment status AND student confirmation
    if (file.payment_status !== 'completed') {
      return res.status(403).json({ error: 'Payment required. Please complete payment first.' });
    }
    if (file.student_confirmed !== true) {
      return res.status(403).json({ error: 'Awaiting student confirmation. The student has not yet confirmed receipt of payment.' });
    }

    const filePath = path.resolve(file.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.setHeader('Content-Type', file.file_type || 'application/octet-stream');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
};
// ====================================================================

export const deliverableUpload = upload.single('file');