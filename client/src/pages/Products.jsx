import axios from "axios";
import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";

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
  const [imageFile, setImageFile] = useState(null);
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
        `http://localhost:5000/api/product?${params}`,
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
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Append all form data
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Append image file
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const url = editProduct
        ? `http://localhost:5000/api/product/${editProduct._id}`
        : "http://localhost:5000/api/product/add";

      const method = editProduct ? "put" : "post";

      const response = await axios[method](url, formDataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          "Content-Type": "multipart/form-data",
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
        setImageFile(null);
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
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const url = editProduct
  //       ? `http://localhost:5000/api/product/${editProduct._id}`
  //       : "http://localhost:5000/api/product/add";

  //     const method = editProduct ? "put" : "post";

  //     const response = await axios[method](url, formData, {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
  //       },
  //     });

  //     if (response.data.success) {
  //       alert(`Product ${editProduct ? "updated" : "added"} successfully`);
  //       setAddEditModal(null);
  //       setEditProduct(null);
  //       setFormData({
  //         name: "",
  //         brandName: "",
  //         description: "",
  //         manufacturer: "",
  //         price: "",
  //         supplierPrice: "",
  //         expiryDate: "",
  //         stock: "",
  //         packageSize: "",
  //         categoryId: "",
  //         supplierId: "",
  //       });
  //       fetchProducts();
  //     } else {
  //       alert(
  //         `Error ${
  //           editProduct ? "updating" : "adding"
  //         } product. Please try again.`
  //       );
  //     }
  //   } catch (error) {
  //     alert(`Error ${editProduct ? "updating" : "adding"} product`, error);
  //   }
  // };

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
    setImageFile(null);
    setEditProduct(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/api/product/${id}`,
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

  // const resetForm = () => {
  //   setFormData({
  //     name: "",
  //     brandName: "",
  //     description: "",
  //     manufacturer: "",
  //     price: "",
  //     supplierPrice: "",
  //     expiryDate: "",
  //     stock: "",
  //     packageSize: "",
  //     categoryId: "",
  //     supplierId: "",
  //   });
  //   setEditProduct(null);
  // };

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

  const packageSizeOptions = [
    { value: "", label: "Select Package Size" },
    { value: "kg", label: "kg" },
    { value: "box", label: "box" },
    { value: "bottle", label: "bottle" },
    { value: "pack", label: "pack" },
    { value: "unit", label: "unit" },
  ];

  const categoryOptions = [
    { value: "", label: "Select Category" },
    ...categories.map((category) => ({
      value: category._id,
      label: category.categoryName,
    })),
  ];

  const supplierOptions = [
    { value: "", label: "Select Supplier" },
    ...suppliers.map((supplier) => ({
      value: supplier._id,
      label: supplier.name,
    })),
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
        hasCheckbox={true}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white border-4 rounded-lg shadow relative w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold">
                {editProduct ? "Edit" : "Add"} Product
              </h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={() => {
                  setAddEditModal(null);
                  resetForm();
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
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Product Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="border p-2 bg-white rounded px-4 w-full"
                    />
                    {editProduct?.image && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Current Image:</p>
                        <img
                          src={editProduct.image}
                          alt="Product"
                          className="h-20 object-cover mt-1"
                        />
                      </div>
                    )}
                  </div>
                  <FormField
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Product Name"
                    required
                  />
                  <FormField
                    label="Brand Name"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    placeholder="Brand Name"
                  />
                  <FormField
                    label="Description"
                    name="description"
                    type="textarea"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Description"
                    required
                  />
                  <FormField
                    label="Manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    placeholder="Manufacturer"
                  />
                  <FormField
                    label="Price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Price"
                    required
                    step="0.01"
                  />
                  <FormField
                    label="Supplier Price"
                    name="supplierPrice"
                    type="number"
                    value={formData.supplierPrice}
                    onChange={handleChange}
                    placeholder="Supplier Price"
                    required
                    step="0.01"
                  />
                  <FormField
                    label="Expiry Date"
                    name="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    placeholder="Expiry Date"
                    required
                  />
                  <FormField
                    label="Stock Quantity"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="Stock Quantity"
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
                    label="Category"
                    name="categoryId"
                    type="select"
                    value={formData.categoryId}
                    onChange={handleChange}
                    options={categoryOptions}
                    required
                  />
                  <FormField
                    label="Supplier"
                    name="supplierId"
                    type="select"
                    value={formData.supplierId}
                    onChange={handleChange}
                    options={supplierOptions}
                    required
                  />
                </div>
                <div className="p-6 border-t border-gray-200 rounded-b">
                  <button
                    type="submit"
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    {editProduct ? "Update" : "Add"} Product
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

export default Products;
