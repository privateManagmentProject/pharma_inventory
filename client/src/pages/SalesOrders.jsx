import axios from "axios";
import jsPDF from "jspdf";
import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";

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
        `http://localhost:5000/api/sales-order?${params}`,
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
      const response = await axios.get("http://localhost:5000/api/product", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });

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
        "http://localhost:5000/api/sales-order/add",
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
        `http://localhost:5000/api/sales-order/${editFormData._id}`,
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
        `http://localhost:5000/api/sales-order/${id}/status`,
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

  const productOptions = [
    { value: "", label: "Select Product" },
    ...products.map((product) => ({
      value: product._id,
      label: `${product.name} - Stock: ${product.stock} ${product.packageSize} - $${product.price}`,
    })),
  ];

  const packageSizeOptions = [
    { value: "", label: "Select Package Size" },
    { value: "kg", label: "kg" },
    { value: "box", label: "box" },
    { value: "bottle", label: "bottle" },
    { value: "pack", label: "pack" },
    { value: "unit", label: "unit" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "progress", label: "Payment in Progress" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
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
          <div className="bg-white border-4 rounded-lg shadow relative w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold">Create Sales Order</h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
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
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-6 gap-6">
                  <FormField
                    label="Product"
                    name="productId"
                    type="select"
                    value={formData.productId}
                    onChange={handleProductChange}
                    options={productOptions}
                    required
                  />
                  <FormField
                    label="Customer Name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Customer Name"
                    required
                  />
                  <FormField
                    label="Package Size"
                    name="packageSize"
                    type="select"
                    value={formData.packageSize}
                    onChange={handleChange}
                    options={packageSizeOptions}
                    required
                  />
                  <FormField
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleQuantityChange}
                    placeholder="Quantity"
                    required
                  />
                  <FormField
                    label="Total Price"
                    name="salesPrice"
                    value={`$${formData.salesPrice}`}
                    className="bg-gray-100"
                    readOnly
                  />
                  <FormField
                    label="Paid Amount"
                    name="paidAmount"
                    type="number"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    placeholder="Paid Amount"
                    step="0.01"
                  />
                </div>
                <div className="p-6 border-t border-gray-200 rounded-b">
                  <button
                    type="submit"
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Create Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white border-4 rounded-lg shadow relative w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold">Update Payment</h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={() => setEditModal(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-6 gap-6">
                  <FormField
                    label="Package Size"
                    name="packageSize"
                    type="select"
                    value={editFormData.packageSize}
                    onChange={handleEditChange}
                    options={packageSizeOptions}
                    required
                  />
                  <FormField
                    label="Customer Name"
                    name="customerName"
                    value={editFormData.customerName}
                    onChange={handleEditChange}
                    placeholder="Customer Name"
                    required
                  />
                  <FormField
                    label="Total Price"
                    name="salesPrice"
                    value={`$${editFormData.salesPrice}`}
                    readOnly
                  />
                  <FormField
                    label="Paid Amount"
                    name="paidAmount"
                    type="number"
                    value={editFormData.paidAmount}
                    onChange={handleEditChange}
                    placeholder="Paid Amount"
                    step="0.01"
                    max={editFormData.salesPrice}
                  />
                  <FormField
                    label="Status"
                    name="status"
                    type="select"
                    value={editFormData.status}
                    onChange={handleEditChange}
                    options={statusOptions}
                  />
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
                <div className="p-6 border-t border-gray-200 rounded-b">
                  <button
                    type="submit"
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Update Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
