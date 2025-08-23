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
      alert("Error fetching products, please try again");
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
      alert(`Error ${editProduct ? "updating" : "adding"} product`);
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
        alert("Error deleting product");
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

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-1 bg-white rounded px-4"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border p-1 bg-white rounded px-4"
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
            className="border p-1 bg-white rounded px-4"
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
          className="px-4 py-1.5 bg-blue-500 text-white rounded cursor-pointer"
          onClick={() => {
            resetForm();
            setAddEditModal(true);
          }}
        >
          Add Product
        </button>
      </div>

      {/* {loading ? (
        <div>Loading ....</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse border border-gray-300 mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">S No</th>
                <th className="border border-gray-300 p-2">Product Name</th>
                <th className="border border-gray-300 p-2">Brand</th>
                <th className="border border-gray-300 p-2">Price</th>
                <th className="border border-gray-300 p-2">Stock</th>
                <th className="border border-gray-300 p-2">Category</th>
                <th className="border border-gray-300 p-2">Supplier</th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product._id}>
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2">{product.name}</td>
                  <td className="border border-gray-300 p-2">
                    {product.brandName}
                  </td>
                  <td className="border border-gray-300 p-2">
                    ${product.price}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {product.stock}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {product.categoryId?.categoryName}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {product.supplierId?.name}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <button
                      className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 mr-2"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
                      onClick={() => handleDelete(product._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )} */}
      <DataTable
        columns={productColumns}
        data={products}
        onEdit={handleEdit}
        onDelete={(product) => handleDelete(product._id)}
        loading={loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-md w-2/3 max-h-screen overflow-y-auto relative">
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
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="brandName"
                  placeholder="Brand Name"
                  value={formData.brandName}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleChange}
                  className="border p-2 rounded col-span-2"
                  required
                />
                <input
                  type="text"
                  name="manufacturer"
                  placeholder="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="number"
                  name="supplierPrice"
                  placeholder="Supplier Price"
                  value={formData.supplierPrice}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="date"
                  name="expiryDate"
                  placeholder="Expiry Date"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="number"
                  name="stock"
                  placeholder="Stock Quantity"
                  value={formData.stock}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="packageSize"
                  placeholder="Package Size"
                  value={formData.packageSize}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
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
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
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
