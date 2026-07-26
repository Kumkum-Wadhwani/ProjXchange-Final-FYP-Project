import express from 'express';
import {
  getAdminStats,
  getAdminUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAdminProjects,
  getProjectById,
  updateProjectStatus,
  updateProject,
  deleteProject,
  getAdminTransactions,
  getAdminEarnings,
  getEditRequests,
  updateEditRequest,
  getCommunityQueries,
  deleteCommunityComment,
  updateCommunityStatus,
  getAdminPosts,
  updatePostStatus,
  deletePost,
  getAllBids           // <-- NEW import
} from '../controllers/adminController.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(authorizeRoles('admin'));

// Admin dashboard stats
router.get('/stats', getAdminStats);

// Users CRUD
router.get('/users', getAdminUsers);
router.post('/users', createUser);
router.patch('/users/:userId', updateUser);
router.patch('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// Projects CRUD
router.get('/projects', getAdminProjects);
router.get('/projects/:projectId', getProjectById);
router.patch('/projects/:projectId/status', updateProjectStatus);
router.patch('/projects/:projectId', updateProject);
router.delete('/projects/:projectId', deleteProject);

// Posts Management Routes
router.get('/posts', getAdminPosts);
router.patch('/posts/:postId/status', updatePostStatus);
router.delete('/posts/:postId', deletePost);

// Approvals routes
router.get('/approvals', getEditRequests);
router.patch('/approvals/:requestId', updateEditRequest);

// Community management routes
router.get('/community', getCommunityQueries);
router.delete('/community/comments/:commentId', deleteCommunityComment);
router.patch('/community/:type/:id/status', updateCommunityStatus);

// Transactions and earnings
router.get('/transactions', getAdminTransactions);
router.get('/earnings', getAdminEarnings);

// ========== NEW: All Bids route ==========
router.get('/bids', getAllBids);

export default router;