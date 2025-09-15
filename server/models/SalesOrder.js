import mongoose from "mongoose";

const SalesOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  productCategory: { type: String },
  quantity: { type: Number, required: true },
  packageSize: { 
    type: String, 
    required: true,
    enum: ['kg', 'box', 'bottle', 'pack', 'unit'] 
  },
  unitPrice: { type: String, required: true },
  totalPrice: { type: String, required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  supplierName: { type: String, required: true }
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
  customerName: { type: String, required: true },
  items: [SalesOrderItemSchema],
  totalAmount: { type: String, required: true },
  paidAmount: { type: Number, default: 0 },
  unpaidAmount: { type: Number, default: function() { return parseFloat(this.totalAmount); } },
  paymentInfo: PaymentInfoSchema,
  status: { 
    type: String, 
    enum: ['pending', 'progress', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update payment status and unpaid amount
SalesOrderSchema.pre('save', function(next) {
  const total = parseFloat(this.totalAmount);
  const paid = this.paidAmount || 0;
  this.unpaidAmount = total - paid;
  
  // Update payment status
  if (paid >= total) {
    this.paymentInfo.status = 'completed';
    this.status = 'completed';
  } else if (paid > 0) {
    this.paymentInfo.status = 'partial';
    this.status = 'progress';
  } else {
    this.paymentInfo.status = 'pending';
    this.status = 'pending';
  }

  // Check if overdue
  const today = new Date();
  const dueDate = new Date(this.paymentInfo.dueDate);
  if (this.paymentInfo.status !== 'completed' && today > dueDate) {
    this.paymentInfo.status = 'overdue';
  }
  
  next();
});

const SalesOrderModal = mongoose.model("SalesOrder", SalesOrderSchema);
export default SalesOrderModal;