import express from "express";
import { createSupplier, getSupplierById, getSuppliers, updateSupplier } from "../controllers/SupplierController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/add", authMiddleware, createSupplier);
router.get("/",authMiddleware, getSuppliers);
router.get("/:id",authMiddleware, getSupplierById);
router.put("/:id",authMiddleware, updateSupplier);
export default router;   