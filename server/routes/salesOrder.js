import express from "express";
import {
    addPayment,
    createSalesOrder,
    getPaymentSchedule,
    getSalesOrderById,
    getSalesOrders,
    updateSalesOrder,
    updateSalesOrderStatus
} from "../controllers/SalesOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Sales order CRUD operations
router.post("/add", createSalesOrder);
router.get("/", getSalesOrders);
router.get("/:id", getSalesOrderById);
router.put("/:id", updateSalesOrder);
router.put("/:id/status", updateSalesOrderStatus);

// Payment operations
router.post("/:id/payment", addPayment);
router.get("/:id/payment-schedule", getPaymentSchedule);

export default router;