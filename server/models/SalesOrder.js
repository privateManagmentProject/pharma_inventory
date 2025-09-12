// Updated SalesOrder.js
import mongoose from "mongoose";

const SalesOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  packageSize: { 
    type: String, 
    required: true,
    enum: ['kg', 'box', 'bottle', 'pack', 'unit'] 
  },
  unitPrice: { type: String, required: true },
  totalPrice: { type: String, required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true }
});

const PaymentInfoSchema = new mongoose.Schema({
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'partial', 'completed', 'overdue'], 
    default: 'pending' 
  }
});

const SalesOrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  items: [SalesOrderItemSchema],
  totalAmount: { type: String, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentInfo: PaymentInfoSchema,
  status: { 
    type: String, 
    enum: ['pending', 'progress', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  customerName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SalesOrderModal = mongoose.model("SalesOrder", SalesOrderSchema);
export default SalesOrderModal;