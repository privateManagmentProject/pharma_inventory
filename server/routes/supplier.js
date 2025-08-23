import express from "express";
import { createSupplier, getSuppliers, updateSupplier } from "../controllers/SupplierController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/add", authMiddleware, createSupplier);
router.get("/",authMiddleware, getSuppliers);
router.put("/:id",authMiddleware, updateSupplier);
export default router;   