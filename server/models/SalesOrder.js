import mongoose from "mongoose";

const SalesOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  productCategory: { type: String },
  quantity: { type: Number, required: true },
  packageSize: { 
    type: String, 
    required: true,
    enum: ['kg', 'box', 'bottle', 'pack', 'pk','tube','vial', 'ampoule','glass','plastic','syrings','sachet','aerosol','spray','bottle','bag','roll','cops','carton','tin','cans','pouches'] 
  },
  unitPrice: { type: Number, required: true },
  supplierPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
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
  secondPaymentDate: { type: Date },
  paymentSchedule: [{
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
  remainingAmount: { type: Number, default: 0 }
});

const SalesOrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  customerName: { type: String, required: true },
  customerTin: { type: String },
  customerAddress: { type: String },
  customerLicense: { type: String },
  items: [SalesOrderItemSchema],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  unpaidAmount: { type: Number, default: 0 },
  paymentInfo: PaymentInfoSchema,
  status: { 
    type: String, 
    enum: ['order_created', 'order_progress', 'payment_progress', 'completed', 'cancelled'], 
    default: 'order_created' 
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware
SalesOrderSchema.pre('save', function(next) {
  const total = this.totalAmount || 0;
  const paid = this.paidAmount || 0;
  
  this.unpaidAmount = isNaN(total - paid) ? total : total - paid;
  this.updatedAt = new Date();
  
  if (this.paymentInfo) {
    this.paymentInfo.totalPaidAmount = paid;
    this.paymentInfo.remainingAmount = isNaN(total - paid) ? total : total - paid;
    
    if (paid >= total) {
      this.paymentInfo.status = 'completed';
    } else if (paid > 0) {
      this.paymentInfo.status = 'partial';
    } else {
      this.paymentInfo.status = 'pending';
    }

    // Overdue check
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
    }
    
    if (isOverdue) {
      this.paymentInfo.status = 'overdue';
    }
  }
  
  next();
});

const SalesOrderModal = mongoose.model("SalesOrder", SalesOrderSchema);
export default SalesOrderModal;