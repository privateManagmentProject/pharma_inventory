import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSalesOrderById } from "./api/ salesOrderAPI";
import type { SalesOrder } from "./constants/salesOrder";

const DetailSalesOrder = () => {
  const { id } = useParams<{ id: string }>();
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);

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
      case "approved":
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "progress":
        return "bg-blue-100 text-blue-800";
      default:
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

  const generatePDF = () => {
    if (!salesOrder) return;

    const doc = new jsPDF();

    // Add header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Order Details", 20, 20);

    // Add company info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Name", 20, 30);
    doc.text("123 Business St, City, Country", 20, 36);
    doc.text("Email: info@company.com", 20, 42);

    // Add order info
    doc.setFontSize(12);
    doc.text(`Order ID: ${salesOrder._id?.slice(-6)}`, 20, 60);
    doc.text(
      `Created: ${new Date(salesOrder.createdAt).toLocaleDateString()}`,
      20,
      68
    );
    doc.text(
      `Payment Due: ${new Date(
        salesOrder.paymentInfo.dueDate
      ).toLocaleDateString()}`,
      20,
      76
    );

    // Customer Information
    autoTable(doc, {
      startY: 90,
      head: [["Customer Information"]],
      body: [[`Name: ${salesOrder.customerName}`]],
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    });

    // Order Items Table
    const itemsData = salesOrder.items.map((item) => [
      item.productName,
      `${item.quantity} ${item.packageSize}`,
      `$${item.unitPrice}`,
      `$${item.totalPrice}`,
      item.supplierName,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Product", "Quantity", "Unit Price", "Total", "Supplier"]],
      body: itemsData,
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    });

    // Payment Information Table
    const balance =
      parseFloat(salesOrder.totalAmount) - (salesOrder.paidAmount || 0);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Payment Information"]],
      body: [
        [`Total Amount: $${salesOrder.totalAmount}`],
        [`Paid Amount: $${salesOrder.paidAmount || 0}`],
        [`Balance: $${balance.toFixed(2)}`],
        [`Status: ${salesOrder.status}`],
        [`Payment Status: ${getPaymentStatus(salesOrder).text}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    });

    // Supplier Breakdown
    const supplierBreakdown: Record<string, number> = {};
    salesOrder.items.forEach((item) => {
      if (!supplierBreakdown[item.supplierName]) {
        supplierBreakdown[item.supplierName] = 0;
      }
      supplierBreakdown[item.supplierName] += parseFloat(item.totalPrice);
    });

    const supplierData = Object.entries(supplierBreakdown).map(
      ([name, total]) => [name, `$${total.toFixed(2)}`]
    );

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Supplier", "Total Amount"]],
      body: supplierData,
      theme: "grid",
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`sales_order_${salesOrder._id?.slice(-6)}.pdf`);
  };

  if (loading) return <div>Loading...</div>;
  if (!salesOrder) return <div>Sales order not found</div>;

  const balance =
    parseFloat(salesOrder.totalAmount) - (salesOrder.paidAmount || 0);
  const paymentStatus = getPaymentStatus(salesOrder);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between">
        <Link to="/sales-orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales Orders
          </Button>
        </Link>
        <Button variant="outline" onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Order ID</h3>
              <p>{salesOrder._id?.slice(-6)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Customer Name</h3>
              <p>{salesOrder.customerName}</p>
            </div>
            <div>
              <h3 className="font-semibold">Created Date</h3>
              <p>{new Date(salesOrder.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Payment Due Date</h3>
              <p>
                {new Date(salesOrder.paymentInfo.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <Badge className={getStatusColor(salesOrder.status)}>
                {salesOrder.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold">Payment Status</h3>
              <Badge className={paymentStatus.color}>
                {paymentStatus.text}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Total Amount</h3>
              <p>${salesOrder.totalAmount}</p>
            </div>
            <div>
              <h3 className="font-semibold">Paid Amount</h3>
              <p>${salesOrder.paidAmount || 0}</p>
            </div>
            <div>
              <h3 className="font-semibold">Balance</h3>
              <p>${balance.toFixed(2)}</p>
            </div>
            {balance === 0 && (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-green-800 font-medium">Payment Completed</p>
              </div>
            )}
            {balance > 0 && (
              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-yellow-800 font-medium">
                  Pending Payment: ${balance.toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {salesOrder.items.map((item, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <h3 className="font-semibold">Product</h3>
                    <p>{item.productName}</p>
                    {item.productCategory && (
                      <p className="text-sm text-muted-foreground">
                        Category: {item.productCategory}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">Quantity</h3>
                    <p>
                      {item.quantity} {item.packageSize}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Unit Price</h3>
                    <p>${item.unitPrice}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Total Price</h3>
                    <p>${item.totalPrice}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Supplier</h3>
                    <p>{item.supplierName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {(() => {
              const supplierBreakdown: Record<string, number> = {};
              salesOrder.items.forEach((item) => {
                if (!supplierBreakdown[item.supplierName]) {
                  supplierBreakdown[item.supplierName] = 0;
                }
                supplierBreakdown[item.supplierName] += parseFloat(
                  item.totalPrice
                );
              });

              return Object.entries(supplierBreakdown).map(([name, total]) => (
                <div
                  key={name}
                  className="p-4 border rounded-md flex justify-between"
                >
                  <h3 className="font-semibold">{name}</h3>
                  <p>${total.toFixed(2)}</p>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailSalesOrder;
