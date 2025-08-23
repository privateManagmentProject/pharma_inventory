import express from "express";
import { createSalesOrder, getSalesOrders, updateSalesOrder, updateSalesOrderStatus } from "../controllers/SalesOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/add", authMiddleware, createSalesOrder);
router.get("/", authMiddleware, getSalesOrders);
router.put("/:id", updateSalesOrder); // Add this line for general updates
router.put("/:id/status", updateSalesOrderStatus); 

export default router;