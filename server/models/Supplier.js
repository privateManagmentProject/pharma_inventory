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
    name: { type: String},
    email: { 
        type: String, 
        default: null, // Use null instead of empty string
        index: true 
    },
    phone: { type: String},
    address: { type: String },
    description: { type: String, default: "" },
    tinNumber: { type: String },
    licenses: [LicenseSchema],
    accounts: [AccountSchema],
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true 
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add sparse index to allow multiple null emails
SupplierSchema.index({ email: 1 }, { sparse: true, unique: true });

const SupplierModal = mongoose.model("Supplier", SupplierSchema);

export default SupplierModal;