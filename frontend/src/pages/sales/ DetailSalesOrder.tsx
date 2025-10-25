import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Supplier } from "../suppliers/constants/supplier";
import { getSalesOrderById } from "./api/ salesOrderAPI";
import type { SalesOrder } from "./constants/salesOrder";

const DetailSalesOrder = () => {
  const { id } = useParams<{ id: string }>();
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSalesOrder();
    }
  }, [id]);

  const fetchSalesOrder = async () => {
    try {
      const response = await getSalesOrderById(id!);
      setSalesOrder(response.salesOrder);
    } catch (error) {
      console.error("Error fetching sales order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "order_progress":
        return "bg-blue-100 text-blue-800";
      case "payment_progress":
        return "bg-purple-100 text-purple-800";
      default: // order_created
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPaymentStatus = (order: SalesOrder) => {
    const today = new Date();
    const dueDate = new Date(order.paymentInfo.dueDate);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (order.paymentInfo.status === "completed") {
      return { text: "Paid", color: "bg-green-100 text-green-800" };
    } else if (order.paymentInfo.status === "overdue") {
      return { text: "Overdue", color: "bg-red-100 text-red-800" };
    } else if (daysRemaining < 0) {
      return { text: "Overdue", color: "bg-red-100 text-red-800" };
    } else if (daysRemaining <= 7) {
      return {
        text: `Due in ${daysRemaining} days`,
        color: "bg-yellow-100 text-yellow-800",
      };
    } else {
      return {
        text: `Due in ${daysRemaining} days`,
        color: "bg-blue-100 text-blue-800",
      };
    }
  };

  // Modified Customer PDF - Simplified item list, total, supplier name(s), and all accounts (handles multiple suppliers and multiple accounts per supplier)
  const generateCustomerPDF = () => {
    if (!salesOrder) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SALES ORDER - CUSTOMER COPY", 20, 20);

    // Company Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Pharma Distributor Inc.", 20, 30);
    doc.text("123 Business St, City, Country", 20, 36);
    doc.text("Phone: +123456789 | Email: info@pharma.com", 20, 42);

    // Order Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Order Information:", 20, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Order ID: ${salesOrder._id?.slice(-6)}`, 20, 68);
    doc.text(
      `Date: ${new Date(salesOrder.createdAt).toLocaleDateString()}`,
      20,
      76
    );
    doc.text(`Customer: ${salesOrder.customerName}`, 20, 84);

    // Item list in simplified format
    let y = 100;
    let itemNumber = 1;
    let total = 0;

    salesOrder.items.forEach((item) => {
      const line = `${itemNumber},${item.productName} ${
        item.quantity
      }×${item.unitPrice.toLocaleString()}bir=${item.totalPrice.toLocaleString()}`;
      doc.text(line, 20, y);
      y += 10;
      itemNumber++;
      total += item.totalPrice;
    });

    // Total
    doc.text(`Total ${total.toLocaleString()}bir`, 20, y);
    y += 10;

    // Collect unique suppliers and their accounts
    const uniqueSuppliers = new Map();
    salesOrder.items.forEach((item) => {
      if (!uniqueSuppliers.has(item.supplierId._id)) {
        uniqueSuppliers.set(item.supplierId._id, item.supplierId);
      }
    });

    uniqueSuppliers.forEach((supplier: Supplier) => {
      // Supplier name
      doc.text(supplier.name, 20, y);
      y += 10;

      // Supplier accounts (handles multiple accounts)
      supplier.accounts.map((account) => {
        const accLine = `${account.name}=${account.number}`;
        doc.text(accLine, 20, y);
        y += 10;
      });

      y += 10; // Space between suppliers if multiple
    });

    doc.save(`customer_order_${salesOrder._id?.slice(-6)}.pdf`);
  };

  // Supplier PDF - Customer info and products without prices
  const generateSupplierPDF = (supplierName: string) => {
    if (!salesOrder) return;

    const doc = new jsPDF();
    const supplierItems = salesOrder.items.filter(
      (item) => item.supplierName === supplierName
    );

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER REQUEST - SUPPLIER COPY", 20, 20);

    // Supplier Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`To: ${supplierName}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);

    // Customer Information (Detailed)
    doc.setFont("helvetica", "bold");
    doc.text("Customer Information:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${salesOrder.customerName}`, 20, 58);
    if (salesOrder.customerTin)
      doc.text(`TIN: ${salesOrder.customerTin}`, 20, 66);
    if (salesOrder.customerAddress)
      doc.text(`Address: ${salesOrder.customerAddress}`, 20, 74);
    if (salesOrder.customerLicense)
      doc.text(`License: ${salesOrder.customerLicense}`, 20, 82);

    // Order Items for this supplier (without prices)
    const itemsData = supplierItems.map((item) => [
      item.productName,
      `${item.quantity} ${item.packageSize}`,
      item.productCategory || "N/A",
    ]);

    autoTable(doc, {
      startY: 95,
      head: [["Product", "Quantity", "Category"]],
      body: itemsData,
      theme: "grid",
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9 },
    });

    doc.save(
      `supplier_order_${salesOrder._id?.slice(-6)}_${supplierName.replace(
        /\s+/g,
        "_"
      )}.pdf`
    );
  };

  // Internal PDF - Complete information with all details
  const generateInternalPDF = () => {
    if (!salesOrder) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SALES ORDER - INTERNAL COPY", 20, 20);

    // Company Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Pharma Distributor Inc.", 20, 30);
    doc.text("123 Business St, City, Country", 20, 36);

    // Customer Information
    autoTable(doc, {
      startY: 50,
      head: [["Customer Details"]],
      body: [
        [`Name: ${salesOrder.customerName}`],
        [`TIN: ${salesOrder.customerTin || "N/A"}`],
        [`Address: ${salesOrder.customerAddress || "N/A"}`],
        [`License: ${salesOrder.customerLicense || "N/A"}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9 },
    });

    // Payment Information
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Payment Details"]],
      body: [
        [`Type: ${salesOrder.paymentInfo.paymentType}`],
        [
          `Due Date: ${new Date(
            salesOrder.paymentInfo.dueDate
          ).toLocaleDateString()}`,
        ],
        [`Status: ${salesOrder.paymentInfo.status}`],
        [`Total Amount: $${salesOrder.totalAmount}`],
        [`Paid Amount: $${salesOrder.paidAmount || 0}`],
        [`Remaining: $${salesOrder.paymentInfo.remainingAmount}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9 },
    });

    // Order Items Table with full details
    const itemsData = salesOrder.items.map((item) => [
      item.productName,
      `${item.quantity} ${item.packageSize}`,
      `$${item.unitPrice}`,
      `$${item.totalPrice}`,
      item.supplierName,
      item.productCategory || "N/A",
      `$${item.supplierPrice}`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [
        [
          "Product",
          "Quantity",
          "Unit Price",
          "Total Price",
          "Supplier",
          "Category",
          "Supplier Price",
        ],
      ],
      body: itemsData,
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9 },
    });

    doc.save(`internal_order_${salesOrder._id?.slice(-6)}.pdf`);
  };

  if (loading) return <div>Loading...</div>;
  if (!salesOrder) return <div>Sales order not found</div>;

  const paymentStatus = getPaymentStatus(salesOrder);

  // Get unique suppliers for dropdown
  const suppliers = Array.from(
    new Set(salesOrder.items.map((item) => item.supplierName))
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link to="/salesOrders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales Orders
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales Order Details</h1>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={generateCustomerPDF}>
                Customer Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {suppliers.map((supplier) => (
                <DropdownMenuItem
                  key={supplier}
                  onClick={() => generateSupplierPDF(supplier)}
                >
                  {supplier} Copy
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={generateInternalPDF}>
                Internal Copy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(salesOrder.status)}>
              {salesOrder.status.replace("_", " ").toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={paymentStatus.color}>{paymentStatus.text}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${salesOrder.totalAmount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Paid: ${(salesOrder.paidAmount || 0).toFixed(2)} | Balance: $
              {(salesOrder.totalAmount - (salesOrder.paidAmount || 0)).toFixed(
                2
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Customer Name</label>
            <p className="text-sm">{salesOrder.customerName}</p>
          </div>
          <div>
            <label className="text-sm font-medium">TIN Number</label>
            <p className="text-sm">{salesOrder.customerTin || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <p className="text-sm">{salesOrder.customerAddress || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm font-medium">License Number</label>
            <p className="text-sm">{salesOrder.customerLicense || "N/A"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesOrder.items.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <p className="text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.productCategory}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <p className="text-sm">
                    {item.quantity} {item.packageSize}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Unit Price</label>
                  <p className="text-sm">${item.unitPrice.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Price</label>
                  <p className="text-sm">${item.totalPrice.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Supplier</label>
                  <p className="text-sm">{item.supplierName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Supplier Price</label>
                  <p className="text-sm">${item.supplierPrice.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Payment Type</label>
              <p className="text-sm capitalize">
                {salesOrder.paymentInfo.paymentType.replace("-", " ")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <p className="text-sm">
                {new Date(salesOrder.paymentInfo.dueDate).toLocaleDateString()}
              </p>
            </div>
            {salesOrder.paymentInfo.secondPaymentDate && (
              <div>
                <label className="text-sm font-medium">
                  Second Payment Date
                </label>
                <p className="text-sm">
                  {new Date(
                    salesOrder.paymentInfo.secondPaymentDate
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {salesOrder.paymentInfo.paymentSchedule &&
            salesOrder.paymentInfo.paymentSchedule.length > 0 && (
              <div>
                <label className="text-sm font-medium">Payment Schedule</label>
                <div className="space-y-2 mt-2">
                  {salesOrder.paymentInfo.paymentSchedule.map(
                    (schedule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">
                          {new Date(schedule.date).toLocaleDateString()}
                        </span>
                        <span className="text-sm">
                          ${schedule.amount.toFixed(2)}
                        </span>
                        <Badge
                          className={
                            schedule.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : schedule.status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {schedule.status}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailSalesOrder;
