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
import { Field, FieldArray, Form, Formik } from "formik";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { getCustomers } from "../customers/api/customerAPI";
import type { Customer } from "../customers/constants/customer";
import { getProducts } from "../products/api/productAPI";
import type { Product } from "../products/constants/product";
import { getSuppliers } from "../suppliers/api/supplierAPI";
import type { Supplier } from "../suppliers/constants/supplier";
import { createSalesOrder } from "./api/ salesOrderAPI";

// const validationSchema = Yup.object({
//   customerId: Yup.string().required("Customer is required"),
//   paymentInfo: Yup.object({
//     paymentType: Yup.string().required("Payment type is required"),
//     dueDate: Yup.date().required("Payment due date is required"),
//   }),
//   items: Yup.array()
//     .of(
//       Yup.object().shape({
//         productId: Yup.string().required("Product is required"),
//         quantity: Yup.number()
//           .required("Quantity is required")
//           .positive("Quantity must be positive")
//           .integer("Quantity must be a whole number")
//           .test(
//             "stock-check",
//             "Quantity exceeds available stock",
//             function (value) {
//               const productId = this.parent.productId;
//               const product = this.options.context?.products.find(
//                 (p: Product) => p._id === productId
//               );
//               return product ? value <= parseInt(product.stock) : true;
//             }
//           ),
//         packageSize: Yup.string().required("Package size is required"),
//       })
//     )
//     .min(1, "At least one item is required"),
// });
const validationSchema = Yup.object({
  customerId: Yup.string().required("Customer is required"),
  paymentInfo: Yup.object({
    paymentType: Yup.string().required("Payment type is required"),
    dueDate: Yup.date().required("Payment due date is required"),
  }),
  items: Yup.array()
    .of(
      Yup.object().shape({
        productId: Yup.string().required("Product is required"),
        quantity: Yup.number()
          .required("Quantity is required")
          .positive("Quantity must be positive")
          .integer("Quantity must be a whole number"),
        packageSize: Yup.string().required("Package size is required"),
      })
    )
    .min(1, "At least one item is required"),
});

const NewSalesOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (productSearchTerm) {
      const filtered = products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productSearchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.products);
      setFilteredProducts(response.products);
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

  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers();
      setSuppliers(response.suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Prepare the data in the format expected by the backend
      const salesOrderData = {
        customerId: values.customerId,
        paymentInfo: {
          paymentType: values.paymentInfo.paymentType,
          dueDate: values.paymentInfo.dueDate.toISOString(),
        },
        items: values.items.map((item: any) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          packageSize: item.packageSize,
        })),
      };

      await createSalesOrder(salesOrderData);
      navigate("/admin/salesOrders");
    } catch (error: any) {
      console.error("Error creating sales order:", error);
      alert(error.response?.data?.message || "Error creating sales order");
    }
  };

  const getProductSuppliers = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return [];

    // Find the supplier for this product
    const supplier = suppliers.find((s) => s._id === product.supplierId);
    return supplier ? [supplier] : [];
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c._id === customerId);
    setSelectedCustomer(customer || null);
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
              customerId: "",
              paymentInfo: {
                paymentType: "one-time",
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              },
              items: [
                {
                  productId: "",
                  quantity: "",
                  packageSize: "",
                },
              ],
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      onValueChange={(value) => {
                        setFieldValue("customerId", value);
                        handleCustomerChange(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customerId && touched.customerId && (
                      <div className="text-red-500 text-sm">
                        {errors.customerId as string}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="paymentInfo.paymentType">
                      Payment Type
                    </Label>
                    <Select
                      value={values.paymentInfo.paymentType}
                      onValueChange={(value) => {
                        setFieldValue("paymentInfo.paymentType", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Payment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">
                          One Time Payment
                        </SelectItem>
                        <SelectItem value="two-time">
                          Two Time Payments
                        </SelectItem>
                        <SelectItem value="date-based">
                          Date Based Payments
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.paymentInfo?.paymentType &&
                      touched.paymentInfo?.paymentType && (
                        <div className="text-red-500 text-sm">
                          {errors.paymentInfo.paymentType as string}
                        </div>
                      )}
                  </div>
                </div>

                {/* Customer Information Display */}
                {selectedCustomer && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">
                        Customer Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <p>{selectedCustomer.name}</p>
                        </div>
                        {selectedCustomer.tinNumber && (
                          <div>
                            <Label className="text-xs">TIN Number</Label>
                            <p>{selectedCustomer.tinNumber}</p>
                          </div>
                        )}
                        {selectedCustomer.address && (
                          <div>
                            <Label className="text-xs">Address</Label>
                            <p>{selectedCustomer.address}</p>
                          </div>
                        )}
                        {selectedCustomer.licenseNumber && (
                          <div>
                            <Label className="text-xs">License Number</Label>
                            <p>{selectedCustomer.licenseNumber}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentInfo.dueDate">
                      Payment Due Date
                    </Label>
                    <DatePicker
                      selected={values.paymentInfo.dueDate}
                      onChange={(date) =>
                        setFieldValue("paymentInfo.dueDate", date)
                      }
                      minDate={new Date()}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {errors.paymentInfo?.dueDate &&
                      touched.paymentInfo?.dueDate && (
                        <div className="text-red-500 text-sm">
                          {errors.paymentInfo.dueDate as string}
                        </div>
                      )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <Label>Order Items</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFieldValue("items", [
                          ...values.items,
                          {
                            productId: "",
                            quantity: "",
                            packageSize: "",
                          },
                        ])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                  </div>

                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search drugs..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <FieldArray name="items">
                    {({ remove, push }) => (
                      <div className="space-y-4">
                        {values.items.map((item, index) => {
                          const productSuppliers = getProductSuppliers(
                            item.productId
                          );
                          const selectedProduct = products.find(
                            (p) => p._id === item.productId
                          );

                          return (
                            <div key={index} className="p-4 border rounded-md">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-medium">
                                  Item #{index + 1}
                                </h4>
                                {values.items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <Label htmlFor={`items.${index}.productId`}>
                                    Product
                                  </Label>
                                  <Select
                                    value={item.productId}
                                    onValueChange={(value) => {
                                      setFieldValue(
                                        `items.${index}.productId`,
                                        value
                                      );
                                      const product = products.find(
                                        (p) => p._id === value
                                      );
                                      if (product) {
                                        setFieldValue(
                                          `items.${index}.packageSize`,
                                          product.packageSize
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {filteredProducts.map((product) => (
                                        <SelectItem
                                          key={product._id}
                                          value={product._id}
                                        >
                                          {product.name} - Stock:{" "}
                                          {product.stock} {product.packageSize}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {errors.items?.[index]?.productId &&
                                    touched.items?.[index]?.productId && (
                                      <div className="text-red-500 text-sm">
                                        {
                                          errors.items[index]
                                            ?.productId as string
                                        }
                                      </div>
                                    )}
                                </div>

                                <div>
                                  <Label htmlFor={`items.${index}.quantity`}>
                                    Quantity
                                  </Label>
                                  <Field
                                    as={Input}
                                    id={`items.${index}.quantity`}
                                    name={`items.${index}.quantity`}
                                    type="number"
                                    placeholder="Enter quantity"
                                    min="1"
                                  />
                                  {errors.items?.[index]?.quantity &&
                                    touched.items?.[index]?.quantity && (
                                      <div className="text-red-500 text-sm">
                                        {
                                          errors.items[index]
                                            ?.quantity as string
                                        }
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
                                  <Label htmlFor={`items.${index}.packageSize`}>
                                    Package Size
                                  </Label>
                                  <Select
                                    value={item.packageSize}
                                    onValueChange={(value) =>
                                      setFieldValue(
                                        `items.${index}.packageSize`,
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select package size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="kg">kg</SelectItem>
                                      <SelectItem value="box">box</SelectItem>
                                      <SelectItem value="bottle">
                                        bottle
                                      </SelectItem>
                                      <SelectItem value="pack">pack</SelectItem>
                                      <SelectItem value="unit">unit</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {errors.items?.[index]?.packageSize &&
                                    touched.items?.[index]?.packageSize && (
                                      <div className="text-red-500 text-sm">
                                        {
                                          errors.items[index]
                                            ?.packageSize as string
                                        }
                                      </div>
                                    )}
                                </div>

                                {productSuppliers.length > 0 && (
                                  <div>
                                    <Label>Supplier & Pricing</Label>
                                    <div className="p-2 bg-muted rounded-md">
                                      <p className="font-medium">
                                        {productSuppliers[0].name}
                                      </p>
                                      {selectedProduct && (
                                        <p className="text-sm">
                                          Selling Price: $
                                          {selectedProduct.price}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </FieldArray>
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
