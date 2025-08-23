import axios from "axios";
import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";

const Products = () => {
  const [addEditModal, setAddEditModal] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    description: "",
    manufacturer: "",
    price: "",
    supplierPrice: "",
    expiryDate: "",
    stock: "",
    packageSize: "",
    categoryId: "",
    supplierId: "",
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter) params.append("category", categoryFilter);
      if (supplierFilter) params.append("supplier", supplierFilter);

      const response = await axios.get(
        `https://inventory-backend-ajj1.onrender.com/api/product?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      setProducts(response.data.products);
      setCategories(response.data.categories || []);
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      alert("Error fetching products, please try again", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter, supplierFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editProduct
        ? `https://inventory-backend-ajj1.onrender.com/api/product/${editProduct._id}`
        : "https://inventory-backend-ajj1.onrender.com/api/product/add";

      const method = editProduct ? "put" : "post";

      const response = await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });

      if (response.data.success) {
        alert(`Product ${editProduct ? "updated" : "added"} successfully`);
        setAddEditModal(null);
        setEditProduct(null);
        setFormData({
          name: "",
          brandName: "",
          description: "",
          manufacturer: "",
          price: "",
          supplierPrice: "",
          expiryDate: "",
          stock: "",
          packageSize: "",
          categoryId: "",
          supplierId: "",
        });
        fetchProducts();
      } else {
        alert(
          `Error ${
            editProduct ? "updating" : "adding"
          } product. Please try again.`
        );
      }
    } catch (error) {
      alert(`Error ${editProduct ? "updating" : "adding"} product`, error);
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      brandName: product.brandName,
      description: product.description,
      manufacturer: product.manufacturer,
      price: product.price,
      supplierPrice: product.supplierPrice,
      expiryDate: product.expiryDate
        ? new Date(product.expiryDate).toISOString().split("T")[0]
        : "",
      stock: product.stock,
      packageSize: product.packageSize,
      categoryId: product.categoryId?._id,
      supplierId: product.supplierId?._id,
    });
    setAddEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await axios.delete(
          `https://inventory-backend-ajj1.onrender.com/api/product/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
            },
          }
        );

        if (response.data.success) {
          alert("Product deleted successfully");
          fetchProducts();
        } else {
          alert("Error deleting product");
        }
      } catch (error) {
        alert("Error deleting product", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brandName: "",
      description: "",
      manufacturer: "",
      price: "",
      supplierPrice: "",
      expiryDate: "",
      stock: "",
      packageSize: "",
      categoryId: "",
      supplierId: "",
    });
    setEditProduct(null);
  };
  const productColumns = [
    { header: "Product Name", field: "name" },
    { header: "Brand", field: "brandName" },
    { header: "Price", field: "price", cell: (item) => `$${item.price}` },
    { header: "Stock", field: "stock" },
    {
      header: "Category",
      field: "categoryId",
      cell: (item) => item.categoryId?.categoryName || "N/A",
    },
    {
      header: "Supplier",
      field: "supplierId",
      cell: (item) => item.supplierId?.name || "N/A",
    },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Product Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 bg-white rounded px-4 w-full"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border p-2 bg-white rounded px-4 w-full sm:w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.categoryName}
              </option>
            ))}
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="border p-2 bg-white rounded px-4 w-full sm:w-auto"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier._id} value={supplier._id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer w-full md:w-auto mt-2 md:mt-0"
          onClick={() => {
            resetForm();
            setAddEditModal(true);
          }}
        >
          Add Product
        </button>
      </div>

      <DataTable
        columns={productColumns}
        data={products}
        onEdit={handleEdit}
        onDelete={(product) => handleDelete(product._id)}
        loading={loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-4xl max-h-screen overflow-y-auto relative">
            <h1 className="text-xl font-bold">
              {editProduct ? "Edit" : "Add"} Product
            </h1>
            <button
              className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
              onClick={() => {
                setAddEditModal(null);
                resetForm();
              }}
            >
              X
            </button>
            <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Brand Name</label>
                  <input
                    type="text"
                    name="brandName"
                    placeholder="Brand Name"
                    value={formData.brandName}
                    onChange={handleChange}
                    className="border p-2 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="font-medium">Description</label>
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    placeholder="Manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="border p-2 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Price</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={formData.price}
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Supplier Price</label>
                  <input
                    type="number"
                    name="supplierPrice"
                    placeholder="Supplier Price"
                    value={formData.supplierPrice}
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    placeholder="Expiry Date"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="Stock Quantity"
                    value={formData.stock}
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
                  <label className="font-medium">Category</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Supplier</label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer mt-4"
              >
                {editProduct ? "Update" : "Add"} Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
