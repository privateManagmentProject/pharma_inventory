export interface SalesOrder {
  _id?: string;
  productId: string | { _id: string; name: string };
  productName: string;
  quantity: number;
  packageSize: string;
  salesPrice: string;
  paidAmount: number;
  status: "pending" | "progress" | "approved" | "rejected";
  customerId: string | { _id: string; name: string };
  customerName: string;
  createdAt: string;
}

export interface SalesOrderFormData {
  productId: string;
  quantity: string;
  packageSize: string;
  salesPrice: string;
  paidAmount: string;
  customerName: string;
  status?: string;
}
