import mongoose from "mongoose";

const LicenseSchema = new mongoose.Schema({
  name: { type: String },
  path: { type: String },
  publicId: { type: String }, // Cloudinary public_id
  type: { type: String }
});

const AccountSchema = new mongoose.Schema({
  name: { type: String },
  number: { type: String },
  isDefault: { type: Boolean, default: false }
});

const SupplierSchema = new mongoose.Schema({ 
    name: { type: String, default: "" },
    email: { 
      type: String,
      default: "",
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    description: { type: String, default: "" },
    tinNumber: { type: String, default: "" },
    licenses: [LicenseSchema],
    accounts: [AccountSchema],
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});



const SupplierModal = mongoose.model("Supplier", SupplierSchema);

export default SupplierModal;