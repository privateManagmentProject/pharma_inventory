import express from "express";
import { createSalesOrder, getSalesOrders, updateSalesOrderStatus } from "../controllers/SalesOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/add", authMiddleware, createSalesOrder);
router.get("/", authMiddleware, getSalesOrders);
router.put("/:id/status", authMiddleware, updateSalesOrderStatus);

export default router;