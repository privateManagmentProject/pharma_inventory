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
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { getCustomers } from "../customers/api/customerAPI";
import type { Customer } from "../customers/constants/customer";
import { getProducts } from "../products/api/productAPI";
import type { Product } from "../products/constants/product";
import { createSalesOrder } from "./api/ salesOrderAPI";

const validationSchema = Yup.object({
  productId: Yup.string().required("Product is required"),
  quantity: Yup.number()
    .required("Quantity is required")
    .positive("Quantity must be positive")
    .integer("Quantity must be a whole number"),
  packageSize: Yup.string().required("Package size is required"),
  customerId: Yup.string().required("Customer  is required"),
  paidAmount: Yup.number().min(0, "Paid amount cannot be negative"),
});

const NewSalesOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      await createSalesOrder(values);
      navigate("/salesOrders");
    } catch (error: any) {
      console.error("Error creating sales order:", error);
      alert(error.response?.data?.message || "Error creating sales order");
    }
  };

  const handleProductChange = (productId: string, setFieldValue: any) => {
    const product = products.find((p) => p._id === productId);
    setSelectedProduct(product || null);

    if (product) {
      setFieldValue("packageSize", product.packageSize);
    }
  };

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
          <CardTitle>Create New Sales Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              productId: "",
              quantity: "",
              packageSize: "",
              customerId: "",
              paidAmount: "0",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productId">Product</Label>
                    <Select
                      onValueChange={(value) => {
                        setFieldValue("productId", value);
                        handleProductChange(value, setFieldValue);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} - Stock: {product.stock}{" "}
                            {product.packageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.productId && touched.productId && (
                      <div className="text-red-500 text-sm">
                        {errors.productId}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      onValueChange={(value) => {
                        setFieldValue("customerId", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer._id} value={customer._id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectContent>
                    </Select>
                    {errors.productId && touched.productId && (
                      <div className="text-red-500 text-sm">
                        {errors.productId}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="packageSize">Package Size</Label>
                    <Select
                      value={values.packageSize}
                      onValueChange={(value) =>
                        setFieldValue("packageSize", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select package size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                        <SelectItem value="bottle">bottle</SelectItem>
                        <SelectItem value="pack">pack</SelectItem>
                        <SelectItem value="unit">unit</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.packageSize && touched.packageSize && (
                      <div className="text-red-500 text-sm">
                        {errors.packageSize}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Field
                      as={Input}
                      id="quantity"
                      name="quantity"
                      type="number"
                      placeholder="Enter quantity"
                    />
                    {errors.quantity && touched.quantity && (
                      <div className="text-red-500 text-sm">
                        {errors.quantity}
                      </div>
                    )}
                    {selectedProduct && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Available stock: {selectedProduct.stock}{" "}
                        {selectedProduct.packageSize}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="paidAmount">Paid Amount</Label>
                    <Field
                      as={Input}
                      id="paidAmount"
                      name="paidAmount"
                      type="number"
                      placeholder="Enter paid amount"
                      step="0.01"
                    />
                    {errors.paidAmount && touched.paidAmount && (
                      <div className="text-red-500 text-sm">
                        {errors.paidAmount}
                      </div>
                    )}
                  </div>

                  {selectedProduct && values.quantity && (
                    <div>
                      <Label>Total Price</Label>
                      <Input
                        value={`$${(
                          parseFloat(selectedProduct.price) *
                          parseInt(values.quantity || "0")
                        ).toFixed(2)}`}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/salesOrders")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Sales Order"}
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

export default NewSalesOrder;
