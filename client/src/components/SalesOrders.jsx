import axios from "axios";
import jsPDF from "jspdf";
import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";

const SalesOrders = () => {
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    packageSize: "",
    salesPrice: "",
    paidAmount: "0",
    customerName: "",
  });
  const [editFormData, setEditFormData] = useState({
    _id: "",
    productId: "",
    quantity: "",
    packageSize: "",
    salesPrice: "",
    paidAmount: "0",
    customerName: "",
    status: "pending",
  });
  const [salesOrders, setSalesOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      const updatedForm = {
        ...prev,
        [name]: value,
      };

      // Auto-update status based on payment
      if (name === "paidAmount") {
        const paid = parseFloat(value);
        const total = parseFloat(prev.salesPrice);

        if (paid >= total) {
          updatedForm.status = "approved";
        } else if (paid > 0) {
          updatedForm.status = "progress";
        } else {
          updatedForm.status = "pending";
        }
      }

      return updatedForm;
    });
  };

  const fetchSalesOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (customerSearch) params.append("customerName", customerSearch);
      if (productSearch) params.append("productName", productSearch);

      const response = await axios.get(
        `https://inventory-backend-ajj1.onrender.com/api/sales-order?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      setSalesOrders(response.data.salesOrders);
    } catch (error) {
      alert("Error fetching sales orders, please try again", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "https://inventory-backend-ajj1.onrender.com/api/product",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      setProducts(response.data.products);
    } catch (error) {
      alert("Error fetching products, please try again", error);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
    fetchProducts();
  }, [statusFilter, customerSearch, productSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://inventory-backend-ajj1.onrender.com/api/sales-order/add",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Sales order created successfully");
        setAddModal(false);
        setFormData({
          productId: "",
          quantity: "",
          packageSize: "",
          salesPrice: "",
          paidAmount: "0",
          customerName: "",
        });
        fetchSalesOrders();
      } else {
        alert("Error creating sales order. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("Error creating sales order");
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `https://inventory-backend-ajj1.onrender.com/api/sales-order/${editFormData._id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Sales order updated successfully");
        setEditModal(false);
        fetchSalesOrders();
      } else {
        alert("Error updating sales order. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("Error updating sales order");
      }
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await axios.put(
        `https://inventory-backend-ajj1.onrender.com/api/sales-order/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Sales order status updated successfully");
        fetchSalesOrders();
      } else {
        alert("Error updating sales order status");
      }
    } catch (error) {
      alert("Error updating sales order status", error);
    }
  };

  const getStatusColor = (status) => {
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

  const generatePDF = (order) => {
    const doc = new jsPDF();

    // Add company header
    doc.setFontSize(20);
    doc.text("Pharma Company", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text("Sales Order Receipt", 105, 25, { align: "center" });

    // Add order details
    doc.setFontSize(10);
    doc.text(`Order ID: ${order._id.slice(-6)}`, 20, 40);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 47);
    doc.text(`Customer: ${order.customerName}`, 20, 54);
    doc.text(`Status: ${order.status}`, 20, 61);
    doc.text(`Paid Amount: $${order.paidAmount}`, 20, 68);

    // Add table headers
    doc.text("Product", 20, 80);
    doc.text("Package", 70, 80);
    doc.text("Quantity", 100, 80);
    doc.text("Price", 140, 80);

    // Add order items
    doc.text(order.productName, 20, 87);
    doc.text(order.packageSize, 70, 87);
    doc.text(`${order.quantity}`, 100, 87);
    doc.text(`$${order.salesPrice}`, 140, 87);

    // Add total
    doc.setFontSize(12);
    doc.text(`Total: $${order.salesPrice}`, 20, 100);
    doc.text(
      `Reaming Payment: $${(
        parseFloat(order.salesPrice) - parseFloat(order.paidAmount || 0)
      ).toFixed(2)}`,
      20,
      107
    );

    // Save the PDF
    doc.save(`sales-order-${order._id.slice(-6)}.pdf`);
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const product = products.find((p) => p._id === productId);
    setSelectedProduct(product);

    setFormData((prev) => ({
      ...prev,
      productId,
      packageSize: product?.packageSize || "",
      salesPrice: product
        ? (parseFloat(product.price) * parseInt(prev.quantity || 0)).toFixed(2)
        : "0.00",
    }));
  };

  const handleQuantityChange = (e) => {
    const quantity = e.target.value;
    const price = selectedProduct
      ? (parseFloat(selectedProduct.price) * parseInt(quantity || 0)).toFixed(2)
      : "0.00";

    setFormData((prev) => ({
      ...prev,
      quantity,
      salesPrice: price,
    }));
  };

  const handleEdit = (order) => {
    setEditFormData({
      _id: order._id,
      productId: order.productId,
      quantity: order.quantity,
      packageSize: order.packageSize,
      salesPrice: order.salesPrice,
      paidAmount: order.paidAmount || "0",
      customerName: order.customerName,
      status: order.status,
    });
    setEditModal(true);
  };

  const salesOrderColumns = [
    { header: "Order ID", field: "_id", cell: (item) => item._id.slice(-6) },
    { header: "Customer Name", field: "customerName" },
    { header: "Product", field: "productName" },
    {
      header: "Quantity",
      field: "quantity",
      cell: (item) => `${item.quantity} ${item.packageSize}`,
    },
    {
      header: "Total Price",
      field: "salesPrice",
      cell: (item) => `$${item.salesPrice}`,
    },
    {
      header: "Paid Amount",
      field: "paidAmount",
      cell: (item) => `$${item.paidAmount || 0}`,
    },
    {
      header: "Balance",
      field: "_id",
      cell: (item) =>
        `$${(
          parseFloat(item.salesPrice) - parseFloat(item.paidAmount || 0)
        ).toFixed(2)}`,
    },
    {
      header: "Status",
      field: "status",
      cell: (item) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
            item.status
          )}`}
        >
          {item.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Date",
      field: "createdAt",
      cell: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      field: "_id",
      cell: (item) => (
        <div className="flex gap-2">
          {item.status === "pending" && (
            <>
              <button
                className="bg-green-500 text-white p-1 rounded-md hover:bg-green-600 text-xs"
                onClick={() => handleStatusUpdate(item._id, "approved")}
              >
                Approve
              </button>
              <button
                className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 text-xs"
                onClick={() => handleStatusUpdate(item._id, "rejected")}
              >
                Reject
              </button>
            </>
          )}
          <button
            className="bg-blue-500 text-white p-1 rounded-md hover:bg-blue-600 text-xs"
            onClick={() => generatePDF(item)}
          >
            Download
          </button>
          <button
            className="bg-gray-500 text-white p-1 rounded-md hover:bg-gray-600 text-xs"
            onClick={() => handleEdit(item)}
          >
            Edit Payment
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Sales Orders Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            placeholder="Search by customer..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="border p-2 bg-white rounded px-4 w-full"
          />
          <input
            type="text"
            placeholder="Search by product..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="border p-2 bg-white rounded px-4 w-full"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 bg-white rounded px-4 w-full sm:w-auto"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="progress">Payment in Progress</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer w-full md:w-auto mt-2 md:mt-0"
          onClick={() => setAddModal(true)}
        >
          Create Sales Order
        </button>
      </div>

      <DataTable
        columns={salesOrderColumns}
        data={salesOrders ?? []}
        loading={loading}
        hasCheckbox={true}
      />

      {addModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-md relative">
            <h1 className="text-xl font-bold">Create Sales Order</h1>
            <button
              className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
              onClick={() => {
                setAddModal(false);
                setFormData({
                  productId: "",
                  quantity: "",
                  packageSize: "",
                  salesPrice: "",
                  paidAmount: "0",
                  customerName: "",
                });
              }}
            >
              X
            </button>
            <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Product</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleProductChange}
                  className="border p-2 rounded"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} - Stock: {product.stock}{" "}
                      {product.packageSize} - ${product.price}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Package Size</label>
                <select
                  name="packageSize"
                  value={formData.packageSize}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                >
                  <option value="">Select Package Size</option>
                  <option value="kg">kg</option>
                  <option value="box">box</option>
                  <option value="bottle">bottle</option>
                  <option value="pack">pack</option>
                  <option value="unit">unit</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={handleQuantityChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Total Price</label>
                <input
                  type="text"
                  name="salesPrice"
                  value={`$${formData.salesPrice}`}
                  className="border p-2 rounded bg-gray-100"
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Paid Amount</label>
                <input
                  type="number"
                  name="paidAmount"
                  placeholder="Paid Amount"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer mt-4"
              >
                Create Order
              </button>
            </form>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-md relative">
            <h1 className="text-xl font-bold">Update Payment</h1>
            <button
              className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
              onClick={() => setEditModal(false)}
            >
              X
            </button>
            <form
              className="flex flex-col gap-4 mt-4"
              onSubmit={handleEditSubmit}
            >
              <div className="flex flex-col gap-1">
                <label className="font-medium">Package Size</label>
                <select
                  name="packageSize"
                  value={editFormData.packageSize}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                >
                  <option value="">Select Package Size</option>
                  <option value="kg">kg</option>
                  <option value="box">box</option>
                  <option value="bottle">bottle</option>
                  <option value="pack">pack</option>
                  <option value="unit">unit</option>
                </select>
              </div>
              {/* <div className="flex flex-col gap-1">
                <label className="font-medium">Product</label>
                <select
                  name="productId"
                  value={editFormData.productId}
                  onChange={handleProductChange}
                  className="border p-2 rounded"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} - Stock: {product.stock}{" "}
                      {product.packageSize} - ${product.price}
                    </option>
                  ))}
                </select>
              </div> */}
              <div className="flex flex-col gap-1">
                <label className="font-medium">Customer Name</label>
                <input
                  type="text"
                  name="productId"
                  placeholder="Customer Name"
                  value={editFormData.productId}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  placeholder="Customer Name"
                  value={editFormData.customerName}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Total Price</label>
                <input
                  type="text"
                  name="salesPrice"
                  value={`$${editFormData.salesPrice}`}
                  className="border p-2 rounded bg-gray-100"
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Paid Amount</label>
                <input
                  type="number"
                  name="paidAmount"
                  placeholder="Paid Amount"
                  value={editFormData.paidAmount}
                  onChange={handleEditChange}
                  className="border p-2 rounded"
                  max={editFormData.salesPrice}
                  step="0.01"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Status</label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditChange}
                  className="border p-2 rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="progress">Payment in Progress</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm">
                  Balance: $
                  {(
                    parseFloat(editFormData.salesPrice) -
                    parseFloat(editFormData.paidAmount || 0)
                  ).toFixed(2)}
                </p>
                <p className="text-sm">
                  Note: Setting paid amount to full price will automatically
                  change status to Approved
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer mt-4"
              >
                Update Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
