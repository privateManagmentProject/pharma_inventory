import express from "express";
import { createCategory, deleteCategory, getCategories, UpdateCategories } from "../controllers/CategoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/add", authMiddleware, createCategory);
router.get("/",authMiddleware, getCategories);
router.put("/:id",authMiddleware, UpdateCategories);
router.delete("/:id", authMiddleware, deleteCategory);
export default router;   