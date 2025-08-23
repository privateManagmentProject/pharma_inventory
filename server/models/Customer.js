import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    address: { type: String, required: true },
    companyName: { type: String, required: true },
    tinNumber: { type: String, required: true },
    phone: { type: String, required: true },
    licenses: [{ type: String }], // Array of file paths/URLs
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