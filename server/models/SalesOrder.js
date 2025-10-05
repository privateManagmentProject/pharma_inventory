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
  paymentType: { 
    type: String, 
    enum: ['one-time', 'two-time', 'date-based'], 
    default: 'one-time',
    required: true
  },
  dueDate: { type: Date, required: true },
  secondPaymentDate: { type: Date }, // For two-time payments
  paymentSchedule: [{ // For date-based payments
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'overdue'], 
      default: 'pending' 
    }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'partial', 'completed', 'overdue'], 
    default: 'pending' 
  },
  totalPaidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number }
});

const SalesOrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  customerName: { type: String, required: true },
  // REMOVED userId field
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
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update payment status and unpaid amount
SalesOrderSchema.pre('save', function(next) {
  const total = parseFloat(this.totalAmount);
  const paid = this.paidAmount || 0;
  this.unpaidAmount = total - paid;
  this.updatedAt = new Date();
  
  // Update payment info - FIX: Check if paymentInfo exists
  if (this.paymentInfo) {
    this.paymentInfo.totalPaidAmount = paid;
    this.paymentInfo.remainingAmount = total - paid;
    
    // Update payment status based on payment type
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

    // Check if overdue based on payment type
    const today = new Date();
    let isOverdue = false;
    
    const paymentType = this.paymentInfo.paymentType || 'one-time';
    
    if (paymentType === 'one-time' && this.paymentInfo.dueDate) {
      const dueDate = new Date(this.paymentInfo.dueDate);
      isOverdue = this.paymentInfo.status !== 'completed' && today > dueDate;
    } else if (paymentType === 'two-time' && this.paymentInfo.secondPaymentDate) {
      const firstDue = new Date(this.paymentInfo.dueDate);
      const secondDue = new Date(this.paymentInfo.secondPaymentDate);
      isOverdue = (this.paymentInfo.status !== 'completed' && today > firstDue) || 
                  (this.paymentInfo.status !== 'completed' && today > secondDue);
    } else if (paymentType === 'date-based' && this.paymentInfo.paymentSchedule) {
      // Check if any scheduled payment is overdue
      isOverdue = this.paymentInfo.paymentSchedule.some(schedule => 
        schedule.status === 'pending' && today > schedule.date
      );
    }
    
    if (isOverdue) {
      this.paymentInfo.status = 'overdue';
    }
  }
  
  next();
});

const SalesOrderModal = mongoose.model("SalesOrder", SalesOrderSchema);
export default SalesOrderModal;