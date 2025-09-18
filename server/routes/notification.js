import express from "express";
import {
    createNotification,
    deleteNotification,
    getNotificationCounts,
    getUserNotifications,
    markAllAsRead,
    markAsRead
} from "../controllers/NotificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Get user notifications with pagination and filtering
router.get("/", getUserNotifications);

// Get notification counts
router.get("/counts", getNotificationCounts);

// Mark notification as read
router.put("/:notificationId/read", markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", markAllAsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

// Create notification (admin only)
router.post("/", createNotification);

export default router;
