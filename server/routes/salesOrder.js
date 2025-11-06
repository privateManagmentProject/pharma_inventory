import express from "express";
import {
    createSalesOrder,
    generateSalesOrderPDF,
    getSalesOrderById,
    getSalesOrders,
    updateSalesOrderStatus
} from "../controllers/SalesOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/add", createSalesOrder);
router.get("/", getSalesOrders);
router.get("/:id", getSalesOrderById);
router.get("/:id/pdf", generateSalesOrderPDF);
router.put("/:id/status", updateSalesOrderStatus);

export default router;