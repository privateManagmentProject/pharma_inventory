export interface SalesOrderItem {
  _id?: string;
  productId:
    | string
    | { _id: string; name: string; categoryId: { _id: string; name: string } };
  productName: string;
  productCategory: string;
  quantity: number;
  packageSize: string;
  unitPrice: number; // Changed from string to number
  supplierPrice: number; // Changed from string to number
  totalPrice: number; // Changed from string to number
  supplierId: string | { _id: string; name: string };
  supplierName: string;
}

export interface PaymentInfo {
  paymentType: "one-time" | "two-time" | "date-based";
  dueDate: string;
  secondPaymentDate?: string;
  paymentSchedule?: Array<{
    date: string;
    amount: number;
    status: "pending" | "paid" | "overdue";
  }>;
  status: "pending" | "partial" | "completed" | "overdue";
  totalPaidAmount: number;
  remainingAmount: number;
}

export interface SalesOrder {
  _id?: string;
  customerId: string | { _id: string; name: string };
  items: SalesOrderItem[];
  totalAmount: number; // Changed from string to number
  paidAmount: number;
  unpaidAmount: number;
  paymentInfo: PaymentInfo;
  status:
    | "order_created"
    | "order_progress"
    | "payment_progress"
    | "completed"
    | "cancelled";
  customerName: string;
  customerTin?: string;
  customerAddress?: string;
  customerLicense?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
