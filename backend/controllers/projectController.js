import {
  createProject,
  getProjects,
  getProjectsByUser,
  getStudentDashboardStats,
  incrementProjectViews,
  incrementInvestorInterests,
  updateProjectRating,
  getAllProjectsForInvestor as originalGetAllProjectsForInvestor,
  createBid,
  getUserBids,
  getProjectById,
  getProjectLikes,
  userLikedProject,
  toggleProjectLike,
  getInvestorBidCredits,
  deductBidCredit
} from "../models/projectModel.js";

import { findUserById } from "../models/userModel.js";
import path from "path";
import pool from "../config/db.js";
import multer from "multer";
import fs from "fs";

// Configure multer for edit request file uploads
const editRequestStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/edit-requests/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'edit-request-' + uniqueSuffix + ext);
  }
});

const editRequestUpload = multer({
  storage: editRequestStorage,
  limits: {
    fileSize: 1000 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Submit a new project
export const submitProject = async (req, res) => {
  try {
    console.log('📤 Submit project request received:', { body: req.body, file: req.file ? req.file.filename : 'No file' });

    const {
      title,
      description,
      category,
      technologies,
      funding_goal,
      timeline,
      university_name
    } = req.body;

    const userId = req.user.id;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description, and category are required" });
    }

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let file_path = null;
    let file_name = null;
    let file_size = null;
    let file_type = null;

    if (req.file) {
      file_path = req.file.filename;
      file_name = req.file.originalname;
      file_size = req.file.size;
      file_type = req.file.mimetype;
    }

    const project = await createProject({
      user_id: userId,
      title,
      description,
      category,
      technologies,
      area_of_focus: category,
      university_name,
      funding_goals: funding_goal || null,
      timeline: timeline || null,
      file_path,
      file_name,
      file_size,
      file_type: file_type || 'application/pdf'
    });

    res.status(201).json({
      message: "Project created successfully!",
      project: {
        ...project,
        file_url: file_path ? `/api/projects/${project.id}/file` : null
      }
    });

  } catch (err) {
    console.error("❌ Submit project error:", err);
    res.status(500).json({ message: "Server error during project submission", error: err.message });
  }
};

// Get projects for logged-in student
export const myProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await getProjectsByUser(userId);
    res.json({ success: true, projects });
  } catch (err) {
    console.error("My projects error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get all projects (for admin or general)
export const allProjects = async (req, res) => {
  try {
    const projects = await getProjects();
    res.json({ success: true, projects });
  } catch (err) {
    console.error("All projects error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Student dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const dashboardData = await getStudentDashboardStats(userId);
    res.json({ success: true, ...dashboardData });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Add project view
export const addProjectView = async (req, res) => {
  try {
    const { project_id } = req.params;
    const result = await incrementProjectViews(project_id);
    res.json({ success: true, views: result.views });
  } catch (err) {
    console.error("Add project view error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Add investor interest
export const addInvestorInterest = async (req, res) => {
  try {
    const { project_id } = req.params;
    const result = await incrementInvestorInterests(project_id);
    res.json({ success: true, investor_interests: result.investor_interests });
  } catch (err) {
    console.error("Add investor interest error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Rate project
export const rateProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const result = await updateProjectRating(project_id, rating);
    res.json({ success: true, rating: result.rating });
  } catch (err) {
    console.error("Rate project error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ========== UPDATED getInvestorProjects – returns ALL projects with funding flags ==========
export const getInvestorProjects = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { category } = req.query;

    // Base query: fetch all projects with student info (no status filter)
    let query = `
      SELECT p.*, u.name as student_name, u.email as student_email
      FROM projects p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category && category !== 'All Categories') {
      query += ` AND p.category = $1`;
      params.push(category);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    let projects = result.rows;
    
    // Add flags: is_funded (any completed payment) and investor_won (this investor's bid paid)
    for (let project of projects) {
      const fundedCheck = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM bids 
          WHERE project_id = $1 AND payment_status = 'completed'
        ) as is_funded`,
        [project.id]
      );
      project.is_funded = fundedCheck.rows[0].is_funded;
      
      const investorWon = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM bids 
          WHERE project_id = $1 AND investor_id = $2 
          AND status = 'approved' AND payment_status = 'completed'
        ) as won`,
        [project.id, investorId]
      );
      project.investor_won = investorWon.rows[0].won;
      
      // Likes
      project.likes = await getProjectLikes(project.id);
      project.user_has_liked = await userLikedProject(investorId, project.id);
    }
    
    res.json({ success: true, projects });
  } catch (err) {
    console.error("Investor projects error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

// Toggle like on a project
export const likeProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const userId = req.user.id;
    const result = await toggleProjectLike(userId, project_id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Like project error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ========== UPDATED placeBid – PREVENTS BIDDING ON FUNDED PROJECTS ==========
export const placeBid = async (req, res) => {
  try {
    const { project_id, amount, message } = req.body;
    const investor_id = req.user.id;

    if (!project_id || !amount) {
      return res.status(400).json({ success: false, message: "Project ID and amount are required" });
    }

    // CRITICAL CHECK: Project already funded (any completed payment)?
    const fundedCheck = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM bids WHERE project_id = $1 AND payment_status = 'completed'
      ) as is_funded`,
      [project_id]
    );
    if (fundedCheck.rows[0].is_funded) {
      return res.status(400).json({ 
        success: false, 
        message: "This project has already been funded and is closed for bidding. Please explore other projects." 
      });
    }

    // Check bid credits
    const credits = await getInvestorBidCredits(investor_id);
    const totalCredits = credits.free_bids_remaining + credits.paid_bids_remaining;
    if (totalCredits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No bid credits remaining. Please purchase a bid pack.",
        needsPurchase: true
      });
    }

    // Deduct one credit
    await deductBidCredit(investor_id);

    // Create the bid
    const bid = await createBid({ project_id, investor_id, amount, message: message || '' });

    res.status(201).json({ 
      success: true, 
      message: "Bid placed successfully! One bid credit used.",
      bid 
    });
  } catch (err) {
    console.error("Place bid error:", err);
    if (err.message === 'No bid credits remaining') {
      return res.status(400).json({ success: false, message: err.message, needsPurchase: true });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get my bids
export const getMyBids = async (req, res) => {
  try {
    const investor_id = req.user.id;
    const bids = await getUserBids(investor_id);
    res.json({ success: true, bids });
  } catch (err) {
    console.error("Get my bids error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get investor's remaining bid credits
export const getBidCredits = async (req, res) => {
  try {
    const investor_id = req.user.id;
    const credits = await getInvestorBidCredits(investor_id);
    res.json({ 
      success: true, 
      freeBids: credits.free_bids_remaining,
      paidBids: credits.paid_bids_remaining,
      totalBids: credits.free_bids_remaining + credits.paid_bids_remaining
    });
  } catch (err) {
    console.error("Get bid credits error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Serve project PDF securely
export const getProjectFile = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getProjectById(id);
    if (!project || !project.file_path) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileLocation = path.join(process.cwd(), 'uploads', project.file_path);
    res.download(fileLocation, project.file_name);
  } catch (err) {
    console.error("Get project file error:", err);
    res.status(500).json({ message: "Error retrieving file", error: err.message });
  }
};

// Submit edit request for a project WITH FILE UPLOAD
export const submitEditRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      project_id, 
      title,
      description,
      category,
      technologies,
      university_name,
      funding_goal,
      timeline,
      reason
    } = req.body;

    if (!project_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and reason are required'
      });
    }

    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you do not have permission to edit this project'
      });
    }

    const project = projectCheck.rows[0];

    const existingRequest = await pool.query(
      'SELECT * FROM edit_requests WHERE project_id = $1 AND user_id = $2 AND status = $3',
      [project_id, userId, 'pending']
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending edit request for this project'
      });
    }

    const currentData = {
      title: project.title,
      description: project.description,
      category: project.category,
      technologies: project.technologies,
      university_name: project.university_name,
      funding_goal: project.funding_goal || project.funding_goals,
      timeline: project.timeline
    };

    const requestedChanges = {};
    if (title && title !== project.title) requestedChanges.title = title;
    if (description && description !== project.description) requestedChanges.description = description;
    if (category && category !== project.category) requestedChanges.category = category;
    if (technologies && technologies !== project.technologies) requestedChanges.technologies = technologies;
    if (university_name && university_name !== project.university_name) requestedChanges.university_name = university_name;
    if (funding_goal && funding_goal !== (project.funding_goal || project.funding_goals)) requestedChanges.funding_goal = funding_goal;
    if (timeline && timeline !== project.timeline) requestedChanges.timeline = timeline;

    if (Object.keys(requestedChanges).length === 0 && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'No changes detected. Please make some changes or upload a new file.'
      });
    }

    let fileData = {};
    if (req.file) {
      fileData = {
        file_path: req.file.path.replace(/\\/g, '/'),
        file_name: req.file.originalname,
        file_size: req.file.size
      };
    }

    const result = await pool.query(
      `INSERT INTO edit_requests 
       (user_id, project_id, current_data, requested_changes, reason, status, 
        file_path, file_name, file_size, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        userId, 
        project_id, 
        JSON.stringify(currentData), 
        JSON.stringify(requestedChanges), 
        reason,
        fileData.file_path || null,
        fileData.file_name || null,
        fileData.file_size || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Edit request submitted successfully. Admin will review it soon.',
      editRequest: result.rows[0]
    });

  } catch (error) {
    console.error('❌ [STUDENT] Submit edit request error:', error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit edit request',
      error: error.message
    });
  }
};

// Get student's edit requests
export const getStudentEditRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        er.*,
        p.title as project_title,
        p.status as project_status
      FROM edit_requests er
      JOIN projects p ON er.project_id = p.id
      WHERE er.user_id = $1
      ORDER BY er.created_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      editRequests: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ [STUDENT] Get edit requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch edit requests',
      error: error.message
    });
  }
};

// Withdraw a bid
export const editRequestFileUpload = editRequestUpload.single('proposal_file');

export const withdrawBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const investorId = req.user.id;
    const result = await pool.query(
      `UPDATE bids SET status = 'withdrawn', updated_at = NOW() 
       WHERE id = $1 AND investor_id = $2 AND status = 'pending'
       RETURNING *`,
      [bidId, investorId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found or cannot be withdrawn' });
    }
    res.json({ success: true, message: 'Bid withdrawn successfully', bid: result.rows[0] });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw bid' });
  }
};

// Track project view
export const trackProjectView = async (req, res) => {
  try {
    const { project_id } = req.params;
    const investor_id = req.user.id;
    
    try {
      const existingTrack = await pool.query(
        'SELECT id FROM project_views_tracking WHERE project_id = $1 AND investor_id = $2',
        [project_id, investor_id]
      );
      
      if (existingTrack.rows.length === 0) {
        await pool.query(
          'INSERT INTO project_views_tracking (project_id, investor_id) VALUES ($1, $2)',
          [project_id, investor_id]
        );
        const result = await incrementProjectViews(project_id);
        return res.json({ success: true, views: result.views, newView: true });
      } else {
        const project = await getProjectById(project_id);
        return res.json({ success: true, views: project?.views || 0, newView: false });
      }
    } catch (tableError) {
      console.log('Tracking table may not exist, using fallback:', tableError.message);
      const result = await incrementProjectViews(project_id);
      return res.json({ success: true, views: result.views, newView: true });
    }
  } catch (err) {
    console.error("Track project view error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get all bids received by the student
// Get all bids received by the student
export const getStudentBidsReceived = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        b.id,
        b.amount,
        b.message,
        b.status,
        b.payment_status,
        b.created_at,
        p.id as project_id,
        p.title as project_title,
        u.name as investor_name,
        u.email as investor_email
      FROM bids b
      JOIN projects p ON b.project_id = p.id
      JOIN users u ON b.investor_id = u.id
      WHERE p.user_id = $1
      ORDER BY b.created_at DESC
    `, [studentId]);

    res.json({ success: true, bids: result.rows });
  } catch (error) {
    console.error('Get student bids received error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bids' });
  }
};

// Student accepts or rejects a bid (auto-reject others on approve)
export const updateBidStatus = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body;
    const studentId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const check = await pool.query(`
      SELECT b.id, b.project_id FROM bids b
      JOIN projects p ON b.project_id = p.id
      WHERE b.id = $1 AND p.user_id = $2
    `, [bidId, studentId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found or not authorized' });
    }

    const projectId = check.rows[0].project_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE bids SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, bidId]
      );

      if (status === 'approved') {
        await client.query(
          `UPDATE bids SET status = 'rejected', updated_at = NOW()
           WHERE project_id = $1 AND id != $2 AND status = 'pending'`,
          [projectId, bidId]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, message: `Bid ${status} successfully` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update bid status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update bid status' });
  }
};