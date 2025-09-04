import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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
              <p>{salesOrder.productName}</p>
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
              <h3 className="font-semibold">Balance</h3>
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
