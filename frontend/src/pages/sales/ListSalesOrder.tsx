import AdvancedFilter from "@/components/AdvancedFilter";
import { DataTable } from "@/components/DataTable";
import { filterIcons, salesOrderFilters } from "@/components/filterConfigs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Edit, Eye, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteSalesOrder, getSalesOrders } from "./api/ salesOrderAPI";
import type { SalesOrder } from "./constants/salesOrder";

const ListSalesOrder = () => {
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const fetchSalesOrders = async () => {
    try {
      const params = new URLSearchParams();

      // Add search term if exists
      if (searchTerm) params.append("search", searchTerm);

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === "createdAt" && value.from && value.to) {
            params.append("dateFrom", value.from);
            params.append("dateTo", value.to);
          } else if (key === "totalAmount" && (value.min || value.max)) {
            if (value.min) params.append("minAmount", value.min);
            if (value.max) params.append("maxAmount", value.max);
          } else if (typeof value === "string" && value.trim() !== "") {
            params.append(key, value);
          }
        }
      });

      const response = await getSalesOrders(params.toString());
      setSalesOrders(response.salesOrders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Call fetchSalesOrders when filters change
  useEffect(() => {
    fetchSalesOrders();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this sales order?")) {
      try {
        await deleteSalesOrder(id);
        fetchSalesOrders();
      } catch (error) {
        console.error("Error deleting sales order:", error);
      }
    }
  };

  const handleFilter = () => {
    fetchSalesOrders();
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
    const dueDate = new Date(order.paymentInfo?.dueDate);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (order.paymentInfo?.status === "completed") {
      return { text: "Paid", color: "bg-green-100 text-green-800" };
    } else if (order.paymentInfo?.status === "overdue") {
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

  const generatePDF = (order: SalesOrder) => {
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
    doc.text(`Order ID: ${order._id?.slice(-6)}`, 20, 60);
    doc.text(
      `Created: ${new Date(order.createdAt).toLocaleDateString()}`,
      20,
      68
    );
    doc.text(
      `Payment Due: ${new Date(
        order.paymentInfo.dueDate
      ).toLocaleDateString()}`,
      20,
      76
    );

    // Customer Information
    autoTable(doc, {
      startY: 90,
      head: [["Customer Information"]],
      body: [[`Name: ${order.customerName}`]],
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
    const itemsData = order.items.map((item) => [
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
    const balance = parseFloat(order.totalAmount) - (order.paidAmount || 0);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Payment Information"]],
      body: [
        [`Total Amount: $${order.totalAmount}`],
        [`Paid Amount: $${order.paidAmount || 0}`],
        [`Balance: $${balance.toFixed(2)}`],
        [`Status: ${order.status}`],
        [`Payment Status: ${getPaymentStatus(order).text}`],
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
    order.items.forEach((item) => {
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

    doc.save(`sales_order_${order._id?.slice(-6)}.pdf`);
  };

  const columns: ColumnDef<SalesOrder>[] = [
    {
      header: "Customer Name",
      accessorKey: "customerName",
    },
    {
      header: "Items Count",
      accessorKey: "items",
      cell: ({ row }) => row.original.items.length,
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ row }) => `$${row.original.totalAmount}`,
    },
    {
      header: "Paid Amount",
      accessorKey: "paidAmount",
      cell: ({ row }) => `$${row.original.paidAmount || 0}`,
    },
    {
      header: "Balance",
      cell: ({ row }) => {
        const order = row.original;
        return `$${(
          parseFloat(order.totalAmount) - (order.paidAmount || 0)
        ).toFixed(2)}`;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.original?.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Payment Status",
      cell: ({ row }) => {
        const status = getPaymentStatus(row.original);
        return <Badge className={status.color}>{status.text}</Badge>;
      },
    },
    {
      header: "Due Date",
      cell: ({ row }) =>
        new Date(row.original.paymentInfo?.dueDate).toLocaleDateString(),
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`${order._id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`edit/${order._id}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => generatePDF(order)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales Orders</h1>
        <Button onClick={() => navigate("new")}>
          <Plus className="mr-2 h-4 w-4" /> New Sales Order
        </Button>
      </div>
      <AdvancedFilter
        filters={salesOrderFilters}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({})}
        title="Sales Order Filters"
        icon={filterIcons.salesOrders}
      />
      <Card className="shadow-md bg-white dark:bg-gray-800">
        <CardContent className="p-0">
          <DataTable
            data={salesOrders}
            columns={columns}
            tableCaption="List of sales orders"
            sorting={sorting}
            setSorting={setSorting}
            pagination={pagination}
            setPagination={setPagination}
            backendPagSorting={false}
          />
          {salesOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No sales orders found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListSalesOrder;
