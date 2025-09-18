import express from "express";
import { getAnalytics, getDashboardStats } from "../controllers/DashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get("/stats", getDashboardStats);

// Get analytics data
router.get("/analytics", getAnalytics);

export default router;
