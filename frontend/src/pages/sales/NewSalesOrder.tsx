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
import { AlertCircle, ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { getCustomers } from "../customers/api/customerAPI";
import type { Customer } from "../customers/constants/customer";
import { getProducts } from "../products/api/productAPI";
import type { Product } from "../products/constants/product";
import { createSalesOrder } from "./api/ salesOrderAPI";

const validationSchema = Yup.object({
  customerId: Yup.string().required("Customer is required"),
  paymentMethod: Yup.string().required("Payment method is required"),
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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
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
            .includes(productSearchTerm.toLowerCase()) ||
          product.brandName
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productSearchTerm, products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, customersResponse] = await Promise.all([
        getProducts("all=true"),
        getCustomers(),
      ]);

      setProducts(productsResponse.products);
      setFilteredProducts(productsResponse.products);
      setCustomers(customersResponse.customers);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);

      const salesOrderData = {
        customerId: values.customerId,
        paymentMethod: values.paymentMethod,
        items: values.items.map((item: any) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          packageSize: item.packageSize,
        })),
      };

      const response = await createSalesOrder(salesOrderData);

      if (response.success) {
        navigate(`/admin/salesOrders/${response.salesOrder._id}`);
      }
    } catch (error: any) {
      console.error("Error creating sales order:", error);
      alert(error.response?.data?.message || "Error creating sales order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerChange = (customerId: string, setFieldValue: any) => {
    const customer = customers.find((c) => c._id === customerId);
    setSelectedCustomer(customer || null);
    setFieldValue("customerId", customerId);
  };

  const calculateItemTotal = (productId: string, quantity: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product || !quantity) return 0;
    return product.soldPrice * parseInt(quantity);
  };

  const calculateOrderTotal = (items: any[]) => {
    return items.reduce((total, item) => {
      return total + calculateItemTotal(item.productId, item.quantity);
    }, 0);
  };

  // Custom SelectValue component for wrapped product names
  const ProductSelectValue = ({ productId }: { productId: string }) => {
    const product = products.find((p) => p._id === productId);

    if (!product) {
      return <span className="text-gray-500">Select Product</span>;
    }

    return (
      <div className="flex flex-col space-y-1 text-left">
        <span className="font-medium text-sm leading-tight break-words">
          {product.name}
        </span>
        <span className="text-xs text-gray-500">
          {product.brandName} | Stock: {product.stock} | ETB {product.soldPrice}
        </span>
      </div>
    );
  };

  // Custom SelectValue component for wrapped customer names
  const CustomerSelectValue = ({ customerId }: { customerId: string }) => {
    const customer = customers.find((c) => c._id === customerId);

    if (!customer) {
      return <span className="text-gray-500">Select Customer</span>;
    }

    return (
      <div className="flex flex-col space-y-1 text-left">
        <span className="font-medium text-sm leading-tight break-words">
          {customer.name}
        </span>
        <span className="text-xs text-gray-500">
          {customer.companyName} - {customer.tinNumber}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/salesOrders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Create Pre-Order</h1>
          <p className="text-gray-600">Create a new pre-order for customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer & Product Selection</CardTitle>
              <p className="text-sm text-gray-600">
                Select customer and add products to create pre-order
              </p>
            </CardHeader>
            <CardContent>
              <Formik
                initialValues={{
                  customerId: "",
                  paymentMethod: "cash",
                  items: [{ productId: "", quantity: "1", packageSize: "kg" }],
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched, setFieldValue, values }) => (
                  <Form className="space-y-6">
                    {/* Customer Selection */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="customerId"
                        className="text-base font-semibold"
                      >
                        Customer *
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleCustomerChange(value, setFieldValue)
                        }
                        value={values.customerId}
                      >
                        <SelectTrigger className="w-full h-auto min-h-[3rem]">
                          <SelectValue>
                            <CustomerSelectValue
                              customerId={values.customerId}
                            />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer._id} value={customer._id}>
                              <div className="flex flex-col py-1">
                                <span className="font-medium text-sm leading-tight break-words">
                                  {customer.name}
                                </span>
                                <span className="text-xs text-gray-500 mt-0.5">
                                  {customer.companyName} - {customer.tinNumber}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.customerId && touched.customerId && (
                        <div className="text-red-500 text-sm flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.customerId as string}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="paymentMethod"
                        className="text-base font-semibold"
                      >
                        Payment Method *
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setFieldValue("paymentMethod", value)
                        }
                        value={values.paymentMethod}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Payment Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.paymentMethod && touched.paymentMethod && (
                        <div className="text-red-500 text-sm flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.paymentMethod as string}</span>
                        </div>
                      )}
                    </div>

                    {/* Customer Information Display */}
                    {selectedCustomer && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-blue-900 mb-3">
                            Customer Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-blue-800">
                                Company:
                              </span>
                              <p className="text-blue-900 break-words">
                                {selectedCustomer.companyName}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">
                                TIN:
                              </span>
                              <p className="text-blue-900 break-words">
                                {selectedCustomer.tinNumber}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">
                                Withhold:
                              </span>
                              <p className="text-blue-900">
                                {selectedCustomer.withhold ? "Yes" : "No"}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">
                                Phone:
                              </span>
                              <p className="text-blue-900 break-words">
                                {selectedCustomer.withholdPhone ||
                                  selectedCustomer.phone}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-medium text-blue-800">
                                Address:
                              </span>
                              <p className="text-blue-900 break-words">
                                {selectedCustomer.address?.region},{" "}
                                {selectedCustomer.address?.zone},{" "}
                                {selectedCustomer.address?.woreda},{" "}
                                {selectedCustomer.address?.kebele}
                              </p>
                            </div>
                            {selectedCustomer.receiverInfo?.name && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-blue-800">
                                  Receiver:
                                </span>
                                <p className="text-blue-900 break-words">
                                  {selectedCustomer.receiverInfo.name} -{" "}
                                  {selectedCustomer.receiverInfo.phone}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Product Search and Selection */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">
                          Order Items *
                        </Label>
                        <span className="text-sm text-gray-500">
                          {values.items.filter((item) => item.productId).length}{" "}
                          items selected
                        </span>
                      </div>

                      {/* Product Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search products by name, brand, or description..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="pl-10 overflow-auto"
                        />
                      </div>

                      {/* Items List */}
                      <FieldArray name="items">
                        {({ push, remove }) => (
                          <div className="space-y-4">
                            {values.items.map((_, index) => (
                              <Card
                                key={index}
                                className="p-4 border-2 border-gray-100"
                              >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                  {/* Product Selection */}
                                  <div className="lg:col-span-5">
                                    <Label>Product *</Label>
                                    <Select
                                      value={values.items[index].productId}
                                      onValueChange={(value) => {
                                        setFieldValue(
                                          `items[${index}].productId`,
                                          value
                                        );
                                        const product = products.find(
                                          (p) => p._id === value
                                        );
                                        if (product) {
                                          setFieldValue(
                                            `items[${index}].packageSize`,
                                            product.packageSize || ""
                                          );
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full h-auto min-h-[3rem]">
                                        <SelectValue>
                                          <ProductSelectValue
                                            productId={
                                              values.items[index].productId
                                            }
                                          />
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto">
                                        {filteredProducts.map((product) => (
                                          <SelectItem
                                            key={product._id}
                                            value={product._id}
                                          >
                                            <div className="flex flex-col py-1">
                                              <span className="font-medium text-sm leading-tight break-words">
                                                {product.name}
                                              </span>
                                              <span className="text-xs text-gray-500 mt-0.5">
                                                {product.brandName} | Stock:{" "}
                                                {product.stock} | ETB{" "}
                                                {product.soldPrice}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {errors.items?.[index]?.productId &&
                                      touched.items?.[index]?.productId && (
                                        <div className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                                          <AlertCircle className="h-3 w-3" />
                                          <span>
                                            {
                                              errors.items[index]
                                                ?.productId as string
                                            }
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Quantity */}
                                  <div className="lg:col-span-3">
                                    <Label>Quantity *</Label>
                                    <Field
                                      as={Input}
                                      type="number"
                                      name={`items[${index}].quantity`}
                                      placeholder="0"
                                      min="1"
                                    />
                                    {errors.items?.[index]?.quantity &&
                                      touched.items?.[index]?.quantity && (
                                        <div className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                                          <AlertCircle className="h-3 w-3" />
                                          <span>
                                            {
                                              errors.items[index]
                                                ?.quantity as string
                                            }
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Package Size */}
                                  <div className="lg:col-span-3">
                                    <Label>Package Size *</Label>
                                    <Select
                                      value={values.items[index].packageSize}
                                      onValueChange={(value) =>
                                        setFieldValue(
                                          `items[${index}].packageSize`,
                                          value
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="box">box</SelectItem>
                                        <SelectItem value="bottle">
                                          bottle
                                        </SelectItem>
                                        <SelectItem value="pack">
                                          pack
                                        </SelectItem>
                                        <SelectItem value="pk">pk</SelectItem>
                                        <SelectItem value="tube">
                                          tube
                                        </SelectItem>
                                        <SelectItem value="vial">
                                          vial
                                        </SelectItem>
                                        <SelectItem value="ampoule">
                                          ampoule
                                        </SelectItem>
                                        <SelectItem value="glass">
                                          glass
                                        </SelectItem>
                                        <SelectItem value="plastic">
                                          plastic
                                        </SelectItem>
                                        <SelectItem value="syrings">
                                          syrings
                                        </SelectItem>
                                        <SelectItem value="sachet">
                                          sachet
                                        </SelectItem>
                                        <SelectItem value="aerosol">
                                          aerosol
                                        </SelectItem>
                                        <SelectItem value="spray">
                                          spray
                                        </SelectItem>
                                        <SelectItem value="bag">bag</SelectItem>
                                        <SelectItem value="roll">
                                          roll
                                        </SelectItem>
                                        <SelectItem value="cops">
                                          cops
                                        </SelectItem>
                                        <SelectItem value="carton">
                                          carton
                                        </SelectItem>
                                        <SelectItem value="tin">tin</SelectItem>
                                        <SelectItem value="cans">
                                          cans
                                        </SelectItem>
                                        <SelectItem value="pouches">
                                          pouches
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {errors.items?.[index]?.packageSize &&
                                      touched.items?.[index]?.packageSize && (
                                        <div className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                                          <AlertCircle className="h-3 w-3" />
                                          <span>
                                            {
                                              errors.items[index]
                                                ?.packageSize as string
                                            }
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Remove Button */}
                                  <div className="lg:col-span-1 flex items-end">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => remove(index)}
                                      disabled={values.items.length === 1}
                                      className="h-10 w-10"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Product Details Display */}
                                {values.items[index].productId && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Stock Available:
                                        </span>
                                        <p
                                          className={
                                            products.find(
                                              (p) =>
                                                p._id ===
                                                values.items[index].productId
                                            )?.stock! <
                                            parseInt(
                                              values.items[index].quantity
                                            )
                                              ? "text-red-600 font-semibold"
                                              : "text-green-600"
                                          }
                                        >
                                          {
                                            products.find(
                                              (p) =>
                                                p._id ===
                                                values.items[index].productId
                                            )?.stock
                                          }{" "}
                                          units
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Unit Price:
                                        </span>
                                        <p>
                                          ETB{" "}
                                          {
                                            products.find(
                                              (p) =>
                                                p._id ===
                                                values.items[index].productId
                                            )?.soldPrice
                                          }
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Supplier:
                                        </span>
                                        <p className="break-words">
                                          {products.find(
                                            (p) =>
                                              p._id ===
                                              values.items[index].productId
                                          )?.supplierId
                                            ? "Assigned"
                                            : "No Supplier"}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Item Total:
                                        </span>
                                        <p className="font-semibold">
                                          ETB{" "}
                                          {calculateItemTotal(
                                            values.items[index].productId,
                                            values.items[index].quantity
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Card>
                            ))}

                            {/* Add Item Button */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                push({
                                  productId: "",
                                  quantity: "1",
                                  packageSize: "kg",
                                })
                              }
                              className="w-full"
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Another
                              Product
                            </Button>
                          </div>
                        )}
                      </FieldArray>

                      {typeof errors.items === "string" && (
                        <div className="text-red-500 text-sm flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.items}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/admin/salesOrders")}
                        className="sm:flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          submitting ||
                          !values.customerId ||
                          values.items.length === 0
                        }
                        className="sm:flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting
                          ? "Creating Pre-Order..."
                          : "Create Pre-Order"}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Formik
                initialValues={{
                  customerId: "",
                  paymentMethod: "cash",
                  items: [{ productId: "", quantity: "", packageSize: "" }],
                }}
              >
                {({ values }) => (
                  <div className="space-y-4">
                    {/* Customer Summary */}
                    {selectedCustomer && (
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm">Customer</h4>
                        <p className="text-sm font-medium break-words">
                          {selectedCustomer.name}
                        </p>
                        <p className="text-xs text-gray-500 break-words">
                          {selectedCustomer.companyName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedCustomer.tinNumber}
                        </p>
                      </div>
                    )}

                    {/* Payment Method Summary */}
                    <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-sm">Payment Method</h4>
                      <p className="text-sm font-medium capitalize">
                        {values.paymentMethod}
                      </p>
                    </div>

                    {/* Items Summary */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Items</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {values.items
                          .filter((item) => item.productId)
                          .map((item, index) => {
                            const product = products.find(
                              (p) => p._id === item.productId
                            );
                            if (!product) return null;

                            return (
                              <div
                                key={index}
                                className="flex justify-between text-sm border-b pb-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium break-words">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.quantity} {item.packageSize} @ ETB{" "}
                                    {product.soldPrice}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    ETB{" "}
                                    {calculateItemTotal(
                                      item.productId,
                                      item.quantity
                                    ).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total Amount:</span>
                        <span>
                          ETB {calculateOrderTotal(values.items).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {values.items.filter((item) => item.productId).length}{" "}
                        items
                      </p>
                    </div>

                    {/* Status Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 text-sm">
                            Pre-Order Status
                          </h4>
                          <p className="text-blue-800 text-xs mt-1">
                            This order will be created as a pre-order. You can
                            update the status and add payment information later
                            in the order details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Formik>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewSalesOrder;
