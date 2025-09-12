// Updated salesOrder.ts
export interface SalesOrderItem {
  _id?: string;
  productId: string | { _id: string; name: string };
  productName: string;
  quantity: number;
  packageSize: string;
  unitPrice: string;
  totalPrice: string;
  supplierId: string | { _id: string; name: string };
  supplierName: string;
}

export interface PaymentInfo {
  dueDate: string;
  status: "pending" | "partial" | "completed" | "overdue";
}

export interface SalesOrder {
  _id?: string;
  customerId: string | { _id: string; name: string };
  items: SalesOrderItem[];
  totalAmount: string;
  paidAmount: number;
  paymentInfo: PaymentInfo;
  status: "pending" | "progress" | "approved" | "rejected" | "completed";
  customerName: string;
  createdAt: string;
}

export interface SalesOrderFormData {
  customerId: string;
  items: {
    productId: string;
    quantity: string;
    packageSize: string;
    supplierId: string;
  }[];
  paymentDueDate: string;
}
