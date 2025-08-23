import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    tinNumber: { type: String, required: true },
    licenses: [{ type: String }], // Array of file paths/URLs
    account: {
        name: { type: String, required: true },
        number: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});

const SupplierModal = mongoose.model("Supplier", SupplierSchema);

export default SupplierModal;