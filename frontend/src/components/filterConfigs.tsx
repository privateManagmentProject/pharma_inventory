import { Package, ShoppingCart, Users } from "lucide-react";

// Customer filter configuration
export const customerFilters = [
  {
    key: "search",
    label: "Search",
    type: "text" as const,
    placeholder: "Search by name, company, or phone...",
  },
  {
    key: "companyName",
    label: "Company",
    type: "text" as const,
    placeholder: "Filter by company name...",
  },
  {
    key: "withhold",
    label: "Withhold",
    type: "select" as const,
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
  },
  {
    key: "createdAt",
    label: "Created Date",
    type: "dateRange" as const,
  },
];

// Supplier filter configuration
export const supplierFilters = [
  {
    key: "search",
    label: "Search",
    type: "text" as const,
    placeholder: "Search by name, email, or phone...",
  },
  {
    key: "email",
    label: "Email",
    type: "text" as const,
    placeholder: "Filter by email...",
  },
  {
    key: "createdAt",
    label: "Created Date",
    type: "dateRange" as const,
  },
];

// Product filter configuration
export const productFilters = [
  {
    key: "search",
    label: "Search",
    type: "text" as const,
    placeholder: "Search by name, brand, or description...",
  },
  {
    key: "category",
    label: "Category",
    type: "select" as const,
    options: [], // Will be populated dynamically
  },
  {
    key: "supplier",
    label: "Supplier",
    type: "select" as const,
    options: [], // Will be populated dynamically
  },
  {
    key: "packageSize",
    label: "Package Size",
    type: "select" as const,
    options: [
      { value: "kg", label: "Kilogram" },
      { value: "box", label: "Box" },
      { value: "bottle", label: "Bottle" },
      { value: "pack", label: "Pack" },
      { value: "unit", label: "Unit" },
    ],
  },
  {
    key: "manufacturer",
    label: "Manufacturer",
    type: "text" as const,
    placeholder: "Filter by manufacturer...",
  },
  {
    key: "price",
    label: "Price Range",
    type: "number" as const,
  },
  {
    key: "stock",
    label: "Stock Range",
    type: "number" as const,
  },
  {
    key: "expiryDate",
    label: "Expiry Date",
    type: "dateRange" as const,
  },
  {
    key: "createdAt",
    label: "Created Date",
    type: "dateRange" as const,
  },
];

// Sales Order filter configuration
export const salesOrderFilters = [
  {
    key: "search",
    label: "Search",
    type: "text" as const,
    placeholder: "Search by customer name or product...",
  },
  {
    key: "status",
    label: "Status",
    type: "select" as const,
    options: [
      { value: "pending", label: "Pending" },
      { value: "progress", label: "In Progress" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "completed", label: "Completed" },
    ],
  },
  {
    key: "paymentStatus",
    label: "Payment Status",
    type: "select" as const,
    options: [
      { value: "pending", label: "Pending" },
      { value: "partial", label: "Partial" },
      { value: "completed", label: "Completed" },
      { value: "overdue", label: "Overdue" },
    ],
  },
  {
    key: "paymentType",
    label: "Payment Type",
    type: "select" as const,
    options: [
      { value: "one-time", label: "One Time" },
      { value: "two-time", label: "Two Time" },
      { value: "date-based", label: "Date Based" },
    ],
  },
  {
    key: "totalAmount",
    label: "Amount Range",
    type: "number" as const,
  },
  {
    key: "createdAt",
    label: "Order Date",
    type: "dateRange" as const,
  },
];

// Filter icons
export const filterIcons = {
  customers: <Users className="h-5 w-5" />,
  suppliers: <Users className="h-5 w-5" />,
  products: <Package className="h-5 w-5" />,
  salesOrders: <ShoppingCart className="h-5 w-5" />,
};
