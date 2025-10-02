import express from "express";
import multer from "multer";
import { createCustomer, deleteCustomer, exportCustomers, getCustomerById, getCustomers, importCustomers, importCustomersBulk, updateCustomer } from "../controllers/CustomerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/add", authMiddleware, createCustomer);
router.get("/", authMiddleware, getCustomers);
router.put("/:id", authMiddleware, updateCustomer);
router.get("/:id", authMiddleware, getCustomerById);
router.delete("/:id", authMiddleware, deleteCustomer);
router.post("/import", authMiddleware, upload.single('file'), importCustomers);
router.post("/import/bulk", authMiddleware, importCustomersBulk);
router.get("/export/excel", authMiddleware, exportCustomers);
export default router;