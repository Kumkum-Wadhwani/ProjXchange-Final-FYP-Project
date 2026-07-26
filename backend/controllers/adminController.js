import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to send welcome email
const sendWelcomeEmail = async (email, name, tempPassword, role) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to ProjXchange - Your Account Has Been Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2d6374;">Welcome to ProjXchange!</h1>
          <p style="font-size: 18px; color: #555;">Your account has been created by the administrator.</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d6374; margin-top: 0;">Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
          <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}/login" style="background: #2d6374; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
        </div>
        
        <div style="font-size: 12px; color: #999; text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          <p>This is an automated message from ProjXchange. For security reasons, please change your password after first login.</p>
          <p>&copy; 2024 ProjXchange. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Get admin dashboard statistics
export const getAdminStats = async (req, res) => {
  try {
    console.log('📊 [ADMIN] Fetching admin stats...');

    const studentsCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
    const investorsCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'investor'");
    const projectsCount = await pool.query("SELECT COUNT(*) FROM projects");
    
    const pendingApprovals = await pool.query("SELECT COUNT(*) FROM edit_requests WHERE status = 'pending'");
    const pendingPosts = await pool.query("SELECT COUNT(*) FROM posts WHERE status = 'pending_review'");
    const pendingComments = await pool.query("SELECT COUNT(*) FROM comments WHERE status = 'pending_review'");

    let activeBids = 0;
    let approvedFundings = 0;

    try {
      const bidsResult = await pool.query("SELECT COUNT(*) FROM bids WHERE status = 'pending'");
      activeBids = parseInt(bidsResult.rows[0]?.count) || 0;
    } catch (err) {
      console.log('⚠️ Bids table might not exist:', err.message);
    }

    try {
      const approvedResult = await pool.query("SELECT COUNT(*) FROM bids WHERE status = 'approved' OR is_accepted = true");
      approvedFundings = parseInt(approvedResult.rows[0]?.count) || 0;
    } catch (err) {
      console.log('⚠️ Error fetching approved bids:', err.message);
    }

    // ========== Get transaction stats from transactions table (PKR) ==========
    let totalRevenue = 0;
    let platformEarnings = 0;
    let totalTransactions = 0;
    let completedTransactions = 0;

    try {
      // Total revenue (sum of all completed transaction amounts)
      const revenueResult = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed'"
      );
      totalRevenue = parseFloat(revenueResult.rows[0]?.total) || 0;

      // Platform earnings (sum of all commissions from completed transactions)
      const earningsResult = await pool.query(
        "SELECT COALESCE(SUM(commission), 0) as total FROM transactions WHERE status = 'completed'"
      );
      platformEarnings = parseFloat(earningsResult.rows[0]?.total) || 0;

      // Total transactions count
      const totalTxResult = await pool.query(
        "SELECT COUNT(*) as count FROM transactions"
      );
      totalTransactions = parseInt(totalTxResult.rows[0]?.count) || 0;

      // Completed transactions count
      const completedTxResult = await pool.query(
        "SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'"
      );
      completedTransactions = parseInt(completedTxResult.rows[0]?.count) || 0;

      console.log(`💰 [ADMIN] Revenue: Rs ${totalRevenue}, Platform Earnings: Rs ${platformEarnings}, Transactions: ${totalTransactions}`);
    } catch (err) {
      console.log('⚠️ Transactions table might not exist:', err.message);
    }

    res.status(200).json({
      success: true,
      totalStudents: parseInt(studentsCount.rows[0].count) || 0,
      totalInvestors: parseInt(investorsCount.rows[0].count) || 0,
      totalProjects: parseInt(projectsCount.rows[0].count) || 0,
      activeBids: activeBids,
      approvedFundings: approvedFundings,
      complaintsPending: 0,
      totalRevenue: totalRevenue,
      platformEarnings: platformEarnings,
      totalTransactions: totalTransactions,
      completedTransactions: completedTransactions,
      pendingApprovals: parseInt(pendingApprovals.rows[0]?.count) || 0,
      pendingCommunityQueries: (parseInt(pendingPosts.rows[0]?.count) || 0) + (parseInt(pendingComments.rows[0]?.count) || 0),
      recentTransactions: [],
      recentActivities: []
    });
  } catch (error) {
    console.error('❌ [ADMIN] Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
};

// Get all users for admin
export const getAdminUsers = async (req, res) => {
  try {
    console.log('👥 [ADMIN] Fetching all users for admin...');

    const result = await pool.query(`
      SELECT id, name, email, role, phone, cnic, is_verified, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    console.log(`✅ [ADMIN] Found ${result.rows.length} users`);

    res.status(200).json({
      success: true,
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ [ADMIN] Users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Create new user (admin manually adds a user) - WITH CUSTOM PASSWORD
export const createUser = async (req, res) => {
  try {
    const { name, email, role, phone, cnic, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    const validRoles = ['student', 'investor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users 
      (name, email, role, phone, cnic, password_hash, is_verified, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, false, true, NOW(), NOW())
      RETURNING id, name, email, role, phone, cnic, is_active`,
      [
        name,
        email,
        role,
        phone || null,
        cnic || null,
        passwordHash
      ]
    );

    let emailSent = false;
    try {
      emailSent = await sendWelcomeEmail(email, name, password, role);
      if (emailSent) {
        console.log(`✅ Welcome email sent to ${email} with password: ${password}`);
      } else {
        console.log(`⚠️ Failed to send email to ${email}`);
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: emailSent ? 'User created successfully. Login credentials sent to their email.' : 'User created successfully. (Email sending failed - check email configuration)',
      user: result.rows[0],
      emailSent: emailSent
    });

  } catch (error) {
    console.error('❌ [ADMIN] Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Update user info (full)
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, phone, cnic, is_verified, is_active } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
    }

    const validRoles = ['student', 'investor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role value' });
    }

    const result = await pool.query(
      `UPDATE users
       SET name=$1, email=$2, role=$3, phone=$4, cnic=$5, is_verified=$6, is_active=$7, updated_at=NOW()
       WHERE id=$8
       RETURNING id, name, email, role, phone, cnic, is_verified, is_active`,
      [name, email, role, phone || null, cnic || null, is_verified || false, is_active || true, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('❌ [ADMIN] Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// Update user status only
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const result = await pool.query(
      `UPDATE users SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, email, role, is_active`,
      [is_active, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: `User ${is_active ? 'activated' : 'deactivated'} successfully`, user: result.rows[0] });
  } catch (error) {
    console.error('❌ [ADMIN] Update user status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status', error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 RETURNING id, name, email`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('❌ [ADMIN] Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

// Get all projects for admin
export const getAdminProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.name as student_name,
        u.email as student_email
      FROM projects p
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);

    res.status(200).json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    console.error('❌ [ADMIN] Fetch projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
};

// Update project status
export const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project status'
      });
    }

    const result = await pool.query(
      `UPDATE projects SET status = $1, last_activity = NOW() WHERE id = $2 RETURNING id, title, status`,
      [status, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Project status updated',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('❌ [ADMIN] Update project status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update project status' });
  }
};

// Update project details
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      technologies,
      area_of_focus,
      university_name,
      description,
      category,
      timeline,
      funding_goals
    } = req.body;

    const result = await pool.query(
      `UPDATE projects
       SET title = $1, technologies = $2, area_of_focus = $3, university_name = $4,
           description = $5, category = $6, timeline = $7, funding_goals = $8, last_activity = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, technologies, area_of_focus, university_name, description, category, timeline, funding_goals, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, message: 'Project updated successfully', project: result.rows[0] });
  } catch (error) {
    console.error('❌ [ADMIN] Update project error:', error);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    try {
      await pool.query('DELETE FROM project_files WHERE project_id = $1', [projectId]);
    } catch (err) {
      console.log('⚠️ Could not delete project files (table might not exist):', err.message);
    }

    const result = await pool.query(`DELETE FROM projects WHERE id = $1 RETURNING id, title`, [projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, message: 'Project deleted successfully', project: result.rows[0] });
  } catch (error) {
    console.error('❌ [ADMIN] Delete project error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project', error: error.message });
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    try {
      const result = await pool.query(`
        SELECT 
          p.*,
          u.name as student_name,
          u.email as student_email,
          u.phone as student_phone,
          u.cnic as student_cnic,
          COALESCE((SELECT json_agg(json_build_object('file_name', pf.file_name, 'file_path', pf.file_path, 'file_size', pf.file_size, 'uploaded_at', pf.uploaded_at)) FROM project_files pf WHERE pf.project_id = p.id), '[]'::json) as files
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `, [projectId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      res.status(200).json({ success: true, project: result.rows[0] });
    } catch (error) {
      console.log('⚠️ Falling back to basic project query:', error.message);
      const result = await pool.query(`
        SELECT p.*, u.name as student_name, u.email as student_email, u.phone as student_phone, u.cnic as student_cnic
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `, [projectId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      res.status(200).json({ success: true, project: { ...result.rows[0], files: [] } });
    }
  } catch (error) {
    console.error('❌ [ADMIN] Get project error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
  }
};

// Get all edit requests (approvals)
export const getEditRequests = async (req, res) => {
  try {
    console.log('📝 [ADMIN] Fetching edit requests...');

    const result = await pool.query(`
      SELECT 
        er.*,
        u.name as student_name,
        u.email as student_email,
        p.title as project_title,
        p.file_path as original_file_path,
        p.file_name as original_file_name
      FROM edit_requests er
      JOIN users u ON er.user_id = u.id
      LEFT JOIN projects p ON er.project_id = p.id
      WHERE er.status = 'pending'
      ORDER BY er.created_at DESC
    `);

    res.status(200).json({
      success: true,
      editRequests: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ [ADMIN] Get edit requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch edit requests', error: error.message });
  }
};

// Update edit request status
export const updateEditRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be "approved" or "rejected"' });
    }

    const editRequestResult = await pool.query('SELECT * FROM edit_requests WHERE id = $1', [requestId]);
    if (editRequestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Edit request not found' });
    }

    const editRequest = editRequestResult.rows[0];

    const result = await pool.query(
      `UPDATE edit_requests SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, admin_notes || null, requestId]
    );

    const updatedRequest = result.rows[0];

    if (status === 'approved' && editRequest.project_id) {
      try {
        const changes = JSON.parse(editRequest.requested_changes);
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        Object.entries(changes).forEach(([field, value]) => {
          if (value !== undefined && value !== null) {
            updateFields.push(`${field} = $${paramCount}`);
            updateValues.push(value);
            paramCount++;
          }
        });

        if (editRequest.file_path && editRequest.file_name) {
          updateFields.push(`file_path = $${paramCount}`);
          updateValues.push(editRequest.file_path);
          paramCount++;
          updateFields.push(`file_name = $${paramCount}`);
          updateValues.push(editRequest.file_name);
          paramCount++;
          updateFields.push(`file_size = $${paramCount}`);
          updateValues.push(editRequest.file_size || 0);
          paramCount++;
        }

        if (updateFields.length > 0) {
          updateValues.push(editRequest.project_id);
          await pool.query(`UPDATE projects SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`, updateValues);
        }
      } catch (updateError) {
        console.error('Error updating project:', updateError);
      }
    }

    res.status(200).json({ success: true, message: `Edit request ${status} successfully`, editRequest: updatedRequest });
  } catch (error) {
    console.error('❌ [ADMIN] Update edit request error:', error);
    res.status(500).json({ success: false, message: 'Failed to update edit request', error: error.message });
  }
};

// Get all community posts and comments for admin
export const getCommunityQueries = async (req, res) => {
  try {
    console.log('💬 [ADMIN] Fetching community queries...');

    const postsResult = await pool.query(`
      SELECT p.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM posts p JOIN users u ON p.user_id = u.id
      ORDER BY CASE WHEN p.status = 'pending_review' THEN 1 WHEN p.status = 'approved' THEN 2 ELSE 3 END, p.created_at DESC
    `);

    const postsWithComments = await Promise.all(postsResult.rows.map(async (post) => {
      const commentsResult = await pool.query(`
        SELECT c.*, u.name as user_name, u.email as user_email, u.role as user_role
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY CASE WHEN c.status = 'pending_review' THEN 1 WHEN c.status = 'approved' THEN 2 ELSE 3 END, c.created_at ASC
      `, [post.id]);

      return { ...post, comments: commentsResult.rows };
    }));

    res.status(200).json({ success: true, communityPosts: postsWithComments, count: postsWithComments.length });
  } catch (error) {
    console.error('❌ [ADMIN] Get community queries error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch community queries', error: error.message });
  }
};

// Get posts specifically for admin approval
export const getAdminPosts = async (req, res) => {
  try {
    console.log('📝 [ADMIN] Fetching posts for approval...');

    const { status } = req.query;
    let query = `
      SELECT p.*, u.name as user_name, u.email as user_email, u.role as user_role,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as total_comments,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'pending_review') as pending_comments
      FROM posts p JOIN users u ON p.user_id = u.id
    `;
    const queryParams = [];
    if (status && ['pending_review', 'approved', 'rejected'].includes(status)) {
      query += ` WHERE p.status = $1`;
      queryParams.push(status);
    }
    query += ` ORDER BY CASE WHEN p.status = 'pending_review' THEN 1 WHEN p.status = 'approved' THEN 2 ELSE 3 END, p.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.status(200).json({ success: true, posts: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('❌ [ADMIN] Get admin posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
  }
};

// Approve/Reject post
export const updatePostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE posts SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, admin_notes || null, postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const postWithUser = await pool.query(`
      SELECT p.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1
    `, [postId]);

    res.status(200).json({ success: true, message: `Post ${status} successfully`, post: postWithUser.rows[0] });
  } catch (error) {
    console.error('❌ [ADMIN] Update post status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update post status', error: error.message });
  }
};

// Delete community comment
export const deleteCommunityComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    const commentCheck = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.status(200).json({ success: true, message: 'Comment deleted successfully', deletedCommentId: commentId, reason: reason || 'No reason provided' });
  } catch (error) {
    console.error('❌ [ADMIN] Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
  }
};

// Update community post/comment status
export const updateCommunityStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    if (!['post', 'comment'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type. Must be "post" or "comment"' });
    }

    const validStatuses = ['approved', 'rejected', 'pending_review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const tableName = type === 'post' ? 'posts' : 'comments';
    const result = await pool.query(`UPDATE ${tableName} SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `${type} not found` });
    }

    res.status(200).json({ success: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} status updated successfully`, updatedItem: result.rows[0] });
  } catch (error) {
    console.error('❌ [ADMIN] Update community status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// Delete post (admin only)
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    const postCheck = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await pool.query('DELETE FROM comments WHERE post_id = $1', [postId]);
    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    res.status(200).json({ success: true, message: 'Post and associated comments deleted successfully', deletedPostId: postId, reason: reason || 'No reason provided' });
  } catch (error) {
    console.error('❌ [ADMIN] Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }
};

// ========== GET ALL BIDS FOR ADMIN ==========
export const getAllBids = async (req, res) => {
  try {
    console.log('💼 [ADMIN] Fetching all bids...');

    const result = await pool.query(`
      SELECT 
        b.id,
        b.amount,
        b.message,
        b.status,
        b.created_at,
        p.title as project_title,
        inv.name as investor_name,
        inv.email as investor_email,
        stu.name as student_name,
        stu.email as student_email
      FROM bids b
      JOIN projects p ON b.project_id = p.id
      JOIN users inv ON b.investor_id = inv.id
      JOIN users stu ON p.user_id = stu.id
      ORDER BY b.created_at DESC
    `);

    res.status(200).json({
      success: true,
      bids: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ [ADMIN] Get all bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids',
      error: error.message
    });
  }
};

// ========== GET ADMIN TRANSACTIONS (with correct column names) ==========
export const getAdminTransactions = async (req, res) => {
  try {
    console.log('💰 [ADMIN] Fetching all transactions...');

    const result = await pool.query(`
      SELECT 
        t.id,
        t.amount,
        t.commission as platform_fee,
        t.net_amount,
        t.status,
        t.created_at,
        t.stripe_payment_intent_id,
        u.name as user_name,
        u.email as user_email,
        p.title as project_title,
        b.id as bid_id
      FROM transactions t
      LEFT JOIN bids b ON t.bid_id = b.id
      LEFT JOIN projects p ON b.project_id = p.id
      LEFT JOIN users u ON b.investor_id = u.id
      ORDER BY t.created_at DESC
    `);

    // Calculate totals
    const totalRevenue = result.rows.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const totalCommission = result.rows.reduce((sum, tx) => sum + parseFloat(tx.platform_fee || 0), 0);
    const totalNet = result.rows.reduce((sum, tx) => sum + parseFloat(tx.net_amount || 0), 0);

    res.status(200).json({
      success: true,
      transactions: result.rows,
      count: result.rows.length,
      summary: {
        totalRevenue: totalRevenue,
        totalCommission: totalCommission,
        totalNetAmount: totalNet,
        completedCount: result.rows.filter(tx => tx.status === 'completed').length,
        pendingCount: result.rows.filter(tx => tx.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN] Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

// ========== GET ADMIN EARNINGS (detailed breakdown) ==========
export const getAdminEarnings = async (req, res) => {
  try {
    console.log('📈 [ADMIN] Fetching earnings breakdown...');

    // Total platform earnings (sum of all commissions)
    const earningsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(commission), 0) as total_earnings,
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions
      FROM transactions
    `);

    // Monthly breakdown
    const monthlyResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(commission), 0) as monthly_earnings,
        COALESCE(SUM(amount), 0) as monthly_revenue,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE status = 'completed'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `);

    res.status(200).json({
      success: true,
      earnings: parseFloat(earningsResult.rows[0]?.total_earnings) || 0,
      totalRevenue: parseFloat(earningsResult.rows[0]?.total_revenue) || 0,
      totalTransactions: parseInt(earningsResult.rows[0]?.total_transactions) || 0,
      completedTransactions: parseInt(earningsResult.rows[0]?.completed_transactions) || 0,
      monthlyBreakdown: monthlyResult.rows
    });
  } catch (error) {
    console.error('❌ [ADMIN] Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings',
      error: error.message
    });
  }
};