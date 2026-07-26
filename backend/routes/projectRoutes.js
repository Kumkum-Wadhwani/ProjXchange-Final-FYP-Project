import express from "express";
import {
  submitProject,
  myProjects,
  allProjects,
  getDashboardStats,
  addProjectView,
  addInvestorInterest,
  rateProject,
  getInvestorProjects,
  placeBid,
  getProjectFile,
  getMyBids,
  submitEditRequest,
  getStudentEditRequests,
  editRequestFileUpload,
  likeProject,
  getBidCredits,
  withdrawBid,
  trackProjectView,
  getStudentBidsReceived,
  updateBidStatus
} from "../controllers/projectController.js";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";
import upload, { handleUploadError } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// STUDENT ROUTES
router.post("/",
  authMiddleware,
  authorizeRoles('student'),
  upload.single('proposal_file'),
  handleUploadError,
  submitProject
);

router.get("/me", authMiddleware, authorizeRoles('student'), myProjects);

router.get("/dashboard-stats", authMiddleware, authorizeRoles('student'), getDashboardStats);

// Student edit request routes with file upload
router.post("/edit-request",
  authMiddleware,
  authorizeRoles('student'),
  editRequestFileUpload,
  (err, req, res, next) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 1000MB.'
        });
      }
      if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({
          success: false,
          message: 'Only PDF files are allowed'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    }
    next();
  },
  submitEditRequest
);

router.get("/edit-requests", authMiddleware, authorizeRoles('student'), getStudentEditRequests);

// INVESTOR ROUTES
router.get("/investor/browse", authMiddleware, authorizeRoles('investor'), getInvestorProjects);
router.post("/investor/bid", authMiddleware, authorizeRoles('investor'), placeBid);
router.get("/investor/my-bids", authMiddleware, authorizeRoles('investor'), getMyBids);
router.get("/investor/bid-credits", authMiddleware, authorizeRoles('investor'), getBidCredits);
router.post("/investor/like/:project_id", authMiddleware, authorizeRoles('investor'), likeProject);
// Withdraw a bid
router.patch('/investor/bid/:bidId/withdraw', authMiddleware, authorizeRoles('investor'), withdrawBid);
// COMMON ROUTES
router.get("/", authMiddleware, allProjects);
router.post("/:project_id/view", authMiddleware, addProjectView);
router.post("/:project_id/interest", authMiddleware, addInvestorInterest);
router.post("/:project_id/rate", authMiddleware, rateProject);
router.get('/:id/file', getProjectFile);

router.post('/investor/track-view/:project_id', authMiddleware, authorizeRoles('investor'), trackProjectView);

// Student views bids received on their projects
router.get('/student/bids-received', authMiddleware, authorizeRoles('student'), getStudentBidsReceived);

// Student updates bid status (accept/reject)
router.patch('/student/bid/:bidId/status', authMiddleware, authorizeRoles('student'), updateBidStatus);
export default router;