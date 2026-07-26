import express from 'express';
import {
  uploadDeliverable,
  getStudentDeliverables,
  deleteDeliverable,
  getInvestorDeliverables,
  downloadInvestorFile,
  deliverableUpload
} from '../controllers/deliverableController.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.post('/student/bid/:bidId/upload', authMiddleware, authorizeRoles('student'), deliverableUpload, uploadDeliverable);
router.get('/student/bid/:bidId/files', authMiddleware, authorizeRoles('student'), getStudentDeliverables);
router.delete('/student/file/:deliverableId', authMiddleware, authorizeRoles('student'), deleteDeliverable);

// Investor routes
router.get('/investor/bid/:bidId/files', authMiddleware, authorizeRoles('investor'), getInvestorDeliverables);
// routes/deliverableRoutes.js
router.get('/investor/file/:fileId/download', authMiddleware, authorizeRoles('investor'), downloadInvestorFile);

export default router;