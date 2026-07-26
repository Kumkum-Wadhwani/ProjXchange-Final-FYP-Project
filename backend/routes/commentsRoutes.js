import express from 'express';
import {
  getCommentsByPost,
  createComment,
  getMyComments,
  updateCommentStatus,
  deleteComment,
  deleteMyComment
} from '../controllers/commentsController.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.get('/post/:postId', authMiddleware, getCommentsByPost);
router.post('/post/:postId', authMiddleware, authorizeRoles('student'), createComment);
router.get('/user/my-comments', authMiddleware, authorizeRoles('student'), getMyComments);
router.delete('/:id', authMiddleware, authorizeRoles('student'), deleteMyComment); // NEW: Student can delete own comment

// Admin routes
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), updateCommentStatus);
router.delete('/admin/:id', authMiddleware, authorizeRoles('admin'), deleteComment);

export default router;