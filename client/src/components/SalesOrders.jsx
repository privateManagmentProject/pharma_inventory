import axios from "axios";
import React, { useEffect, useState } from "react";

const SalesOrders = () => {
  const [addModal, setAddModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    packageSize: "",
    salesPrice: "",
    customerName: "",
  });
  const [salesOrders, setSalesOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      alert("Error fetching sales orders, please try again");
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
      alert("Error fetching products, please try again");
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
      alert("Error updating sales order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
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
      header: "Price",
      field: "salesPrice",
      cell: (item) => `$${item.salesPrice}`,
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
          {item.status}
        </span>
      ),
    },
    {
      header: "Date",
      field: "createdAt",
      cell: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Sales Orders Management</h1>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by customer..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="border p-1 bg-white rounded px-4"
          />
          <input
            type="text"
            placeholder="Search by product..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="border p-1 bg-white rounded px-4"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-1 bg-white rounded px-4"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          className="px-4 py-1.5 bg-blue-500 text-white rounded cursor-pointer"
          onClick={() => setAddModal(true)}
        >
          Create Sales Order
        </button>
      </div>

      {loading ? (
        <div>Loading ....</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse border border-gray-300 mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Order ID</th>
                <th className="border border-gray-300 p-2">Customer Name</th>
                <th className="border border-gray-300 p-2">Product</th>
                <th className="border border-gray-300 p-2">Quantity</th>
                <th className="border border-gray-300 p-2">Price</th>
                <th className="border border-gray-300 p-2">Status</th>
                <th className="border border-gray-300 p-2">Date</th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((order) => (
                <tr key={order._id}>
                  <td className="border border-gray-300 p-2">
                    {order._id.slice(-6)}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {order.customerName}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {order.productName}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {order.quantity} {order.packageSize}
                  </td>
                  <td className="border border-gray-300 p-2">
                    ${order.salesPrice}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {order.status === "pending" && (
                      <>
                        <button
                          className="bg-green-500 text-white p-1 rounded-md hover:bg-green-600 mr-2 text-xs"
                          onClick={() =>
                            handleStatusUpdate(order._id, "approved")
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 text-xs"
                          onClick={() =>
                            handleStatusUpdate(order._id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-md w-1/2 relative">
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
                  customerName: "",
                });
              }}
            >
              X
            </button>
            <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - Stock: {product.stock}{" "}
                    {product.packageSize}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="packageSize"
                placeholder="Package Size (e.g., kg, units)"
                value={formData.packageSize}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                name="salesPrice"
                placeholder="Sales Price"
                value={formData.salesPrice}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="customerName"
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
              >
                Create Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
