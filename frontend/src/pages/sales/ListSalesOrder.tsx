import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
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

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);

      const response = await getSalesOrders(params.toString());
      setSalesOrders(response.salesOrders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

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
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const columns: ColumnDef<SalesOrder>[] = [
    {
      header: "Customer Name",
      accessorKey: "customerName",
    },
    {
      header: "Product",
      accessorKey: "productId.name",
    },
    {
      header: "Quantity",
      accessorKey: "quantity",
      cell: ({ row }) => `${row.original.quantity} ${row.original.packageSize}`,
    },
    {
      header: "Total Price",
      accessorKey: "salesPrice",
      cell: ({ row }) => `$${row.original.salesPrice}`,
    },
    {
      header: "Paid Amount",
      accessorKey: "paidAmount",
      cell: ({ row }) => `$${row.original.paidAmount || 0}`,
    },
    {
      header: "Unpaid Amount",
      cell: ({ row }) => {
        const order = row.original;
        return `$${(
          parseFloat(order.salesPrice) - (order.paidAmount || 0)
        ).toFixed(2)}`;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
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
              onClick={() => handleDelete(order._id!)}
            >
              <Trash2 className="h-4 w-4" />
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

      {/* <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by customer or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleFilter}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card> */}

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
