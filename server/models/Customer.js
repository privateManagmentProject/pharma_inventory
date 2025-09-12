import mongoose from "mongoose";
const LicenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, required: true }
});
const CustomerSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    address: { type: String, required: true },
    companyName: { type: String, required: true },
    tinNumber: { type: String, required: true },
    phone: { type: String, required: true },
    description: { type: String, default: "" },
    licenses: [LicenseSchema], // Changed to array of objects
    receiverInfo: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true }
    },
    withhold: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const CustomerModal = mongoose.model("Customer", CustomerSchema);

export default CustomerModal;