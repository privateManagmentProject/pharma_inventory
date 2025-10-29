import mongoose from "mongoose";

const LicenseSchema = new mongoose.Schema({
  name: { type: String },
  path: { type: String },
  type: { type: String }
});

const AccountSchema = new mongoose.Schema({
  name: { type: String },
  number: { type: String },
  isDefault: { type: Boolean, default: false }
});

const SupplierSchema = new mongoose.Schema({ 
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    description: { type: String, default: "" },
    tinNumber: { type: String },
    licenses: [LicenseSchema],
    accounts: [AccountSchema], // Changed to array of accounts
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Track which user added this supplier
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SupplierModal = mongoose.model("Supplier", SupplierSchema);

export default SupplierModal;