export interface Product {
  _id?: string;
  name: string;
  brandName?: string;
  description: string;
  manufacturer?: string;
  price: string;
  supplierPrice: string;
  expiryDate: string;
  stock: string;
  packageSize: string;
  image?: string;
  categoryId: string;
  supplierId: string;
}
