import mongoose from "mongoose";

const LicenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, required: true }
});

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const SupplierSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, default: "" },
    tinNumber: { type: String, required: true },
    licenses: [LicenseSchema],
    accounts: [AccountSchema], // Changed to array of accounts
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Track which user added this supplier
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SupplierModal = mongoose.model("Supplier", SupplierSchema);

export default SupplierModal;