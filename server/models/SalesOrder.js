import mongoose from "mongoose";

const SalesOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String },
  productCategory: { type: String },
  quantity: { type: Number },
  packageSize: { 
    type: String, 
    required: true,
    enum: ['kg', 'box', 'bottle', 'pack', 'pk','tube','vial', 'ampoule','glass','plastic','syrings','sachet','aerosol','spray','bottle','bag','roll','cops','carton','tin','cans','pouches'] 
  },
  unitPrice: { type: Number },
  supplierPrice: { type: Number },
  totalPrice: { type: Number },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  supplierName: { type: String }
});

const PaymentSlipSchema = new mongoose.Schema({
  name: { type: String },
  path: { type: String },
  publicId: { type: String },
  type: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

const LicenseFileSchema = new mongoose.Schema({
  name: { type: String },
  path: { type: String },
  publicId: { type: String },
  type: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

const PaymentInfoSchema = new mongoose.Schema({
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'check', 'credit'], 
    required: true 
  },
  paymentSlips: [PaymentSlipSchema],
  status: { 
    type: String, 
    enum: ['pending', 'partial', 'completed', 'overdue', 'cancelled'], 
    default: 'pending' 
  },
  totalPaidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  dueDate: { type: Date },
  creditLimit: { type: Number, default: 0 },
  creditDays: { type: Number, default: 0 }
});

const SalesOrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  customerName: { type: String },
  customerTin: { type: String },
  customerAddress: { 
    region: { type: String },
    zone: { type: String },
    woreda: { type: String },
    kebele: { type: String }
  },
  customerLicense: { type: String },
  licenseFiles: [LicenseFileSchema],
  companyName: { type: String },
  withhold: { type: Boolean, default: false },
  withholdPhone: { type: String },
  receiverName: { type: String },
  receiverPhone: { type: String },
  receiverAddress: { type: String },
  items: [SalesOrderItemSchema],
  totalAmount: { type: Number },
  paidAmount: { type: Number, default: 0 },
  unpaidAmount: { type: Number, default: 0 },
  paymentInfo: PaymentInfoSchema,
  status: { 
    type: String, 
    enum: [
      'pre_order', 
      'sales_order_started', 
      'payment_completed', 
      'payment_progress', 
      'credit', 
      'supplier_checked', 
      'cancelled_payment'
    ], 
    default: 'pre_order' 
  },
  cancellationReason: { type: String },
  notes: { type: String },
  step: { type: Number, default: 1 }, // 1: Pre-order, 2: Payment, 3: Supplier Check
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
    
    // Auto-update payment status based on amounts
    if (paid >= total) {
      this.paymentInfo.status = 'completed';
    } else if (paid > 0) {
      this.paymentInfo.status = 'partial';
    } else {
      this.paymentInfo.status = 'pending';
    }

    // Overdue check for credit payments
    const today = new Date();
    if (this.paymentInfo.dueDate && this.paymentInfo.status !== 'completed') {
      const dueDate = new Date(this.paymentInfo.dueDate);
      if (today > dueDate) {
        this.paymentInfo.status = 'overdue';
      }
    }

    // Update step based on status
    if (this.status === 'pre_order') {
      this.step = 1;
    } else if (['sales_order_started', 'payment_progress', 'payment_completed', 'credit'].includes(this.status)) {
      this.step = 2;
    } else if (this.status === 'supplier_checked') {
      this.step = 3;
    } else if (this.status === 'cancelled_payment') {
      this.step = 0;
    }
  }
  
  next();
});

const SalesOrderModal = mongoose.model("SalesOrder", SalesOrderSchema);
export default SalesOrderModal;