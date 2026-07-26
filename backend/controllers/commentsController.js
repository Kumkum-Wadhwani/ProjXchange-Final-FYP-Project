import pool from '../config/db.js';

// Get comments for a post (students see ALL approved comments + their own pending/rejected comments)
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // First check if post exists and user can view it
    const postCheck = await pool.query(`
      SELECT * FROM posts 
      WHERE id = $1 AND (status = 'approved' OR user_id = $2)
    `, [postId, userId]);

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or not approved'
      });
    }

    // Get ALL approved comments (from any student)
    const approvedComments = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.status = 'approved'
      ORDER BY c.created_at ASC
    `, [postId]);

    // Get user's own pending/rejected comments
    const myComments = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.user_id = $2 AND c.status IN ('pending_review', 'rejected')
      ORDER BY c.created_at ASC
    `, [postId, userId]);

    const allComments = [...approvedComments.rows, ...myComments.rows];
    allComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.status(200).json({
      success: true,
      comments: allComments,
      count: allComments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Create new comment (student submits comment)
export const createComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Check if post exists and user can comment on it
    const postCheck = await pool.query(`
      SELECT * FROM posts 
      WHERE id = $1 AND (status = 'approved' OR user_id = $2)
    `, [postId, userId]);

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you cannot comment on this post'
      });
    }

    const post = postCheck.rows[0];

    // Check if user has too many pending comments
    const pendingCount = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE user_id = $1 AND status = $2',
      [userId, 'pending_review']
    );

    if (parseInt(pendingCount.rows[0].count) >= 20) {
      return res.status(400).json({
        success: false,
        message: 'You have too many pending comments. Please wait for admin to review your existing comments.'
      });
    }

    // Insert comment
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending_review', NOW(), NOW())
       RETURNING *`,
      [postId, userId, content.trim()]
    );

    // Get comment with user info
    const commentWithUser = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.role as user_role,
        p.title as post_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully! It will be visible after admin approval.',
      comment: commentWithUser.rows[0]
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

// Get student's own comments
export const getMyComments = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        c.*, 
        p.title as post_title,
        p.status as post_status,
        u.name as user_name,
        u.role as user_role
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1
      ORDER BY 
        CASE 
          WHEN c.status = 'pending_review' THEN 1
          WHEN c.status = 'approved' THEN 2
          ELSE 3
        END,
        c.created_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      comments: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching my comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your comments',
      error: error.message
    });
  }
};

// Update comment status (for admin approval)
export const updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await pool.query(
      `UPDATE comments 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Get comment with user info for response
    const commentWithUser = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        p.title as post_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = $1
    `, [id]);

    res.status(200).json({
      success: true,
      message: `Comment ${status} successfully`,
      comment: commentWithUser.rows[0]
    });
  } catch (error) {
    console.error('Error updating comment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment status'
    });
  }
};

// Delete comment (for admin)
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if comment exists
    const commentCheck = await pool.query(
      'SELECT * FROM comments WHERE id = $1',
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Delete the comment
    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCommentId: id,
      reason: reason || 'No reason provided'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// NEW: Delete comment (student can delete their own comments)
export const deleteMyComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment exists and belongs to user
    const commentCheck = await pool.query(
      'SELECT * FROM comments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you do not have permission to delete it'
      });
    }

    // Delete the comment
    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCommentId: id
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};