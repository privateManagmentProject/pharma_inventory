import mongoose from "mongoose";
const LicenseSchema = new mongoose.Schema({
  name: { type: String},
  path: { type: String},
  type: { type: String}
});
const CustomerSchema = new mongoose.Schema({ 
    name: { type: String},
    address: { type: String},
    companyName: { type: String},
    tinNumber: { type: String},
    phone: { type: String},
    description: { type: String, default: "" },
    licenses: [LicenseSchema], // Changed to array of objects
    receiverInfo: {
        name: { type: String},
        phone: { type: String},
        address: { type: String}
    },
    withhold: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User"}, // Track which user added this customer
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const CustomerModal = mongoose.model("Customer", CustomerSchema);

export default CustomerModal;