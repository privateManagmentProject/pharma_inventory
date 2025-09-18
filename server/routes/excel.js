import express from "express";
import {
    exportCustomers,
    exportSuppliers,
    getCustomerTemplate,
    getSupplierTemplate,
    importCustomers,
    importSuppliers
} from "../controllers/ExcelController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Import routes
router.post("/import/customers", importCustomers);
router.post("/import/suppliers", importSuppliers);

// Export routes
router.get("/export/customers", exportCustomers);
router.get("/export/suppliers", exportSuppliers);

// Template routes
router.get("/template/customers", getCustomerTemplate);
router.get("/template/suppliers", getSupplierTemplate);

export default router;
