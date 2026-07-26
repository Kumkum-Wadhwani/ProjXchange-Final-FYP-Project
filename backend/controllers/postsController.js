import pool from '../config/db.js';

// Get student's own posts (only for students - shows all statuses)
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        (
          SELECT COUNT(*) 
          FROM comments c 
          WHERE c.post_id = p.id AND c.status = 'approved'
        ) as approved_comment_count,
        (
          SELECT COUNT(*) 
          FROM comments c 
          WHERE c.post_id = p.id AND c.user_id = $1
        ) as my_comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY 
        CASE 
          WHEN p.status = 'pending_review' THEN 1
          WHEN p.status = 'approved' THEN 2
          ELSE 3
        END,
        p.created_at DESC
    `, [userId]);

    // Get comments for each post (only approved comments)
    const postsWithComments = await Promise.all(result.rows.map(async (post) => {
      const commentsResult = await pool.query(`
        SELECT 
          c.*,
          u.name as user_name,
          u.role as user_role
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1 AND c.status = 'approved'
        ORDER BY c.created_at ASC
      `, [post.id]);

      return {
        ...post,
        comments: commentsResult.rows
      };
    }));

    res.status(200).json({
      success: true,
      posts: postsWithComments,
      count: postsWithComments.length
    });
  } catch (error) {
    console.error('Error fetching my posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your posts',
      error: error.message
    });
  }
};

// Get single post by ID (student can view if approved OR if they own it)
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post exists and user has permission
    const postResult = await pool.query(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND (p.status = 'approved' OR p.user_id = $2)
    `, [id, userId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to view it'
      });
    }

    const post = postResult.rows[0];

    // Get approved comments for this post
    const commentsResult = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.status = 'approved'
      ORDER BY c.created_at ASC
    `, [id]);

    // Get user's own pending/rejected comments for this post
    const myPendingComments = await pool.query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.user_id = $2 AND c.status IN ('pending_review', 'rejected')
      ORDER BY c.created_at ASC
    `, [id, userId]);

    post.comments = [...commentsResult.rows, ...myPendingComments.rows];
    post.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.status(200).json({
      success: true,
      post: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error.message
    });
  }
};

// Create new post (student submits question/issue)
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Check if user has too many pending posts
    const pendingCount = await pool.query(
      'SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = $2',
      [userId, 'pending_review']
    );

    if (parseInt(pendingCount.rows[0].count) >= 10) {
      return res.status(400).json({
        success: false,
        message: 'You have too many pending posts. Please wait for admin to review your existing posts.'
      });
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, title, content, category, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending_review', NOW(), NOW())
       RETURNING *`,
      [userId, title, content, category || null]
    );

    // Get post with user info
    const postWithUser = await pool.query(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      message: 'Post submitted successfully! It will be visible after admin approval.',
      post: postWithUser.rows[0]
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
};

// Update post status (for admin approval)
export const updatePostStatus = async (req, res) => {
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
      `UPDATE posts 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get post with user info for response
    const postWithUser = await pool.query(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    res.status(200).json({
      success: true,
      message: `Post ${status} successfully`,
      post: postWithUser.rows[0]
    });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post status'
    });
  }
};

// Get all posts for admin (including pending ones)
export const getAllPostsForAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        (
          SELECT COUNT(*) 
          FROM comments c 
          WHERE c.post_id = p.id
        ) as total_comments,
        (
          SELECT COUNT(*) 
          FROM comments c 
          WHERE c.post_id = p.id AND c.status = 'pending_review'
        ) as pending_comments
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY 
        CASE 
          WHEN p.status = 'pending_review' THEN 1
          WHEN p.status = 'approved' THEN 2
          ELSE 3
        END,
        p.created_at DESC
    `);

    // Get all comments for each post
    const postsWithComments = await Promise.all(result.rows.map(async (post) => {
      const commentsResult = await pool.query(`
        SELECT 
          c.*,
          u.name as user_name,
          u.email as user_email,
          u.role as user_role
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY 
          CASE 
            WHEN c.status = 'pending_review' THEN 1
            WHEN c.status = 'approved' THEN 2
            ELSE 3
          END,
          c.created_at ASC
      `, [post.id]);

      return {
        ...post,
        comments: commentsResult.rows
      };
    }));

    res.status(200).json({
      success: true,
      posts: postsWithComments,
      count: postsWithComments.length
    });
  } catch (error) {
    console.error('Error fetching posts for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
};

// Get posts for student community (ALL approved posts + student's own pending/rejected posts)
export const getPostsForStudentCommunity = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        u.id as user_id,  -- ADDED: Include user_id for filtering in frontend
        (
          SELECT COUNT(*) 
          FROM comments c 
          WHERE c.post_id = p.id AND c.status = 'approved'
        ) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'approved' OR (p.user_id = $1 AND p.status IN ('pending_review', 'rejected'))
      ORDER BY 
        CASE 
          WHEN p.status = 'approved' THEN 1
          ELSE 2
        END,
        p.created_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      posts: result.rows
    });
  } catch (error) {
    console.error('Error fetching posts for community:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
};

// Delete post (admin only)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete posts'
      });
    }

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // First delete all comments associated with the post
    await pool.query('DELETE FROM comments WHERE post_id = $1', [id]);
    
    // Then delete the post
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted successfully',
      deletedPostId: id
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
};

// NEW: Delete post (student can delete their own posts)
export const deleteMyPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const postCheck = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to delete it'
      });
    }

    // First delete all comments associated with the post
    await pool.query('DELETE FROM comments WHERE post_id = $1', [id]);
    
    // Then delete the post
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted successfully',
      deletedPostId: id
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
};