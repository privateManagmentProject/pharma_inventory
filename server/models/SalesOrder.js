import mongoose from "mongoose";

const SalesOrderSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
   packageSize: { 
  type: String, 
  required: true,
  enum: ['kg', 'box', 'bottle', 'pack', 'unit'] 
},
    salesPrice: { type: String, required: true },
   paidAmount: { type: Number, default: 0 }, // Add this field
    status: { 
        type: String, 
        enum: ['pending', 'progress', 'approved', 'rejected'], // Add payment_in_progress
        default: 'pending' 
    },
    customerName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const SalesOrderModal = mongoose.model("SalesOrder", SalesOrderSchema);

export default SalesOrderModal;