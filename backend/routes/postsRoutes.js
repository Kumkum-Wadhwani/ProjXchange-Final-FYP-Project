import express from 'express';
import {
  getPostsForStudentCommunity,
  getPostById,
  createPost,
  getMyPosts,
  updatePostStatus,
  getAllPostsForAdmin,
  deletePost,
  deleteMyPost
} from '../controllers/postsController.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.get('/student/community', authMiddleware, authorizeRoles('student'), getPostsForStudentCommunity);
router.get('/user/my-posts', authMiddleware, authorizeRoles('student'), getMyPosts);
router.get('/:id', authMiddleware, getPostById);
router.post('/', authMiddleware, authorizeRoles('student'), createPost);
router.delete('/:id', authMiddleware, authorizeRoles('student'), deleteMyPost); // NEW: Student can delete own post

// Admin-only routes
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), getAllPostsForAdmin);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), updatePostStatus);
router.delete('/admin/:id', authMiddleware, authorizeRoles('admin'), deletePost);

export default router;