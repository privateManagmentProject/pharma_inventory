import mongoose from "mongoose";

const LicenseSchema = new mongoose.Schema({
  name: { type: String },
  path: { type: String },
  publicId: { type: String }, // Cloudinary public_id
  type: { type: String }
});

const AddressSchema = new mongoose.Schema({
  region: { type: String },
  zone: { type: String },
  woreda: { type: String },
  kebele: { type: String }
});

const CustomerSchema = new mongoose.Schema({ 
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  address: AddressSchema,
  companyName: { type: String },
  tinNumber: { type: String },
  description: { type: String, default: "" },
  licenses: [LicenseSchema],
  receiverInfo: {
    name: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  withhold: { type: Boolean, default: false },
  withholdPhone: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CustomerModal = mongoose.model("Customer", CustomerSchema);

export default CustomerModal;