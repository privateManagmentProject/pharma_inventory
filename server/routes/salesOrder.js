import express from "express";
import {
    addPayment,
    createSalesOrder,
    generateSalesOrderPDF,
    getPaymentSchedule,
    getSalesOrderById,
    getSalesOrders,
    updateSalesOrder,
    updateSalesOrderStatus
} from "../controllers/SalesOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/add", createSalesOrder);
router.get("/", getSalesOrders);
router.get("/:id", getSalesOrderById);
router.get("/:id/pdf", generateSalesOrderPDF); // New PDF route
router.put("/:id", updateSalesOrder);
router.put("/:id/status", updateSalesOrderStatus);
router.post("/:id/payment", addPayment);
router.get("/:id/payment-schedule", getPaymentSchedule);

export default router;