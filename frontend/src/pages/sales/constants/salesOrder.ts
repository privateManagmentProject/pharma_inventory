export interface SalesOrderItem {
  _id?: string;
  productId:
    | string
    | { _id: string; name: string; categoryId: { _id: string; name: string } };
  productName: string;
  productCategory: string;
  quantity: number;
  packageSize: string;
  unitPrice: string;
  totalPrice: string;
  supplierId: string | { _id: string; name: string };
  supplierName: string;
}

export interface PaymentInfo {
  paymentType: "one-time" | "two-time" | "date-based";
  dueDate: string;
  secondPaymentDate?: string; // For two-time payments
  paymentSchedule?: Array<{
    // For date-based payments
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
  totalAmount: string;
  paidAmount: number;
  unpaidAmount: number;
  paymentInfo: PaymentInfo;
  status: "pending" | "progress" | "approved" | "rejected" | "completed";
  customerName: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface SalesOrderFormData {
  customerId: string;
  paymentInfo: {
    paymentType: string;
    dueDate: string;
    secondPaymentDate?: string;
    paymentSchedule?: Array<{
      date: string;
      amount: number;
    }>;
  };
  items: {
    productId: string;
    quantity: number;
    packageSize: string;
  }[];
  notes?: string;
}
