import express from "express";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../controllers/ProductController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/add", authMiddleware, createProduct);
router.get("/", authMiddleware, getProducts);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);
export default router;