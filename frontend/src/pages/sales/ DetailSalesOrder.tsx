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
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!salesOrder) return <div>Sales order not found</div>;
  const generatePDF = () => {
    if (!salesOrder) return;

    const doc = new jsPDF();

    // Add header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Order Details", 20, 20);

    // Add company info (placeholder for logo)
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

    // Order Information Table
    autoTable(doc, {
      startY: 80,
      head: [["Field", "Details"]],
      body: [
        ["Customer Name", salesOrder.customerName],
        ["Product", salesOrder.productId.name],
        ["Quantity", `${salesOrder.quantity} ${salesOrder.packageSize}`],
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

    // Payment Information Table
    const balance =
      parseFloat(salesOrder.salesPrice) - (salesOrder.paidAmount || 0);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Field", "Details"]],
      body: [
        ["Total Price", `$${salesOrder.salesPrice}`],
        ["Paid Amount", `$${salesOrder.paidAmount || 0}`],
        ["Unpaid Amount", `$${balance.toFixed(2)}`],
        ["Status", salesOrder.status],
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
  const balance =
    parseFloat(salesOrder.salesPrice) - (salesOrder.paidAmount || 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link to="/sales-orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales Orders
          </Button>
        </Link>
        <Button variant="outline" onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <h3 className="font-semibold">Product</h3>
              <p>{salesOrder.productId.name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Quantity</h3>
              <p>
                {salesOrder.quantity} {salesOrder.packageSize}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Created Date</h3>
              <p>{new Date(salesOrder.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Total Price</h3>
              <p>${salesOrder.salesPrice}</p>
            </div>
            <div>
              <h3 className="font-semibold">Paid Amount</h3>
              <p>${salesOrder.paidAmount || 0}</p>
            </div>
            <div>
              <h3 className="font-semibold">Un paid Amount</h3>
              <p>${balance.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <Badge className={getStatusColor(salesOrder.status)}>
                {salesOrder.status}
              </Badge>
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
    </div>
  );
};

export default DetailSalesOrder;
