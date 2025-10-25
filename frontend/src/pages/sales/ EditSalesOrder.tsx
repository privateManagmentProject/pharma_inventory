import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, Form, Formik } from "formik";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { getSalesOrderById, updateSalesOrder } from "./api/ salesOrderAPI";
import type { SalesOrder } from "./constants/salesOrder";

const EditSalesOrder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const getValidationSchema = () => {
    if (!salesOrder) return Yup.object({});

    const balance =
      parseFloat(salesOrder.totalAmount) - (salesOrder.paidAmount || 0);
    return Yup.object({
      paidAmount: Yup.number()
        .min(0, "Paid amount cannot be negative")
        .max(balance, "Cannot pay more than the unpaid amount"),
      status: Yup.string().required("Status is required"),
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      await updateSalesOrder(id!, values);
      navigate("/admin/salesOrders");
    } catch (error: any) {
      console.error("Error updating sales order:", error);
      alert(error.response?.data?.message || "Error updating sales order");
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

  if (loading) return <div>Loading...</div>;
  if (!salesOrder) return <div>Sales order not found</div>;

  const balance =
    parseFloat(salesOrder.totalAmount) - (salesOrder.paidAmount || 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link to="/salesOrders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales Orders
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Sales Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Order Information</h3>
              <p>
                <strong>Order ID:</strong> {salesOrder._id?.slice(-6)}
              </p>
              <p>
                <strong>Customer:</strong> {salesOrder.customerName}
              </p>
              {salesOrder.customerTin && (
                <p>
                  <strong>TIN:</strong> {salesOrder.customerTin}
                </p>
              )}
              {salesOrder.customerAddress && (
                <p>
                  <strong>Address:</strong> {salesOrder.customerAddress}
                </p>
              )}
              <p>
                <strong>Items:</strong> {salesOrder.items.length} products
              </p>
              <p>
                <strong>Created Date:</strong>{" "}
                {new Date(salesOrder.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Payment Due Date:</strong>{" "}
                {new Date(salesOrder.paymentInfo.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Payment Information</h3>
              <p>
                <strong>Total Amount:</strong> ${salesOrder.totalAmount}
              </p>
              <p>
                <strong>Current Paid Amount:</strong> $
                {salesOrder.paidAmount || 0}
              </p>
              <p>
                <strong>Balance:</strong> ${balance.toFixed(2)}
              </p>
              <p>
                <strong>Current Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                    salesOrder.status
                  )}`}
                >
                  {salesOrder.status.replace("_", " ").toUpperCase()}
                </span>
              </p>
              <p>
                <strong>Payment Status:</strong> {salesOrder.paymentInfo.status}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="grid grid-cols-1 gap-4">
              {salesOrder.items.map((item, index) => (
                <div key={index} className="p-4 border rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <h4 className="font-semibold">Product</h4>
                      <p>{item.productName}</p>
                      {item.productCategory && (
                        <p className="text-sm text-muted-foreground">
                          Category: {item.productCategory}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">Quantity</h4>
                      <p>
                        {item.quantity} {item.packageSize}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Unit Price</h4>
                      <p>${item.unitPrice}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Supplier Price</h4>
                      <p>${item.supplierPrice || item.unitPrice}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Total Price</h4>
                      <p>${item.totalPrice}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Supplier</h4>
                      <p>{item.supplierName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Formik
            initialValues={{
              paidAmount: "0", // Start from 0 for additional payment
              status: salesOrder.status,
            }}
            validationSchema={getValidationSchema()}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paidAmount">
                      Additional Payment Amount
                    </Label>
                    <Field
                      as={Input}
                      id="paidAmount"
                      name="paidAmount"
                      type="number"
                      placeholder="Enter additional payment amount"
                      step="0.01"
                      max={balance}
                    />
                    {errors.paidAmount && touched.paidAmount && (
                      <div className="text-red-500 text-sm">
                        {errors.paidAmount}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum: ${balance.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={values.status}
                      onValueChange={(value) => setFieldValue("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order_created">
                          Order Created
                        </SelectItem>
                        <SelectItem value="order_progress">
                          Order Progress
                        </SelectItem>
                        <SelectItem value="payment_progress">
                          Payment Progress
                        </SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && touched.status && (
                      <div className="text-red-500 text-sm">
                        {errors.status}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Payment Summary</h4>
                  <p>Total Amount: ${salesOrder.totalAmount}</p>
                  <p>Current Paid Amount: ${salesOrder.paidAmount || 0}</p>
                  <p>
                    Additional Payment: ${parseFloat(values.paidAmount || "0")}
                  </p>
                  <p>
                    New Total Paid: $
                    {(
                      (salesOrder.paidAmount || 0) +
                      parseFloat(values.paidAmount || "0")
                    ).toFixed(2)}
                  </p>
                  <p>
                    New Balance: $
                    {(balance - parseFloat(values.paidAmount || "0")).toFixed(
                      2
                    )}
                  </p>
                  <p className="mt-2 text-sm">
                    <strong>Status Flow:</strong>
                    <br />
                    • Order Created: Customer places order
                    <br />
                    • Order Progress: Supplier confirms order
                    <br />
                    • Payment Progress: Payment process starts
                    <br />• Completed: Order fully paid and delivered
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/salesOrders")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Sales Order"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSalesOrder;
