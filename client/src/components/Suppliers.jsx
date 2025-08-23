import axios from "axios";
import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";

const Suppliers = () => {
  const [addEditModal, setAddEditModal] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  useEffect(() => {
    if (searchTerm) {
      const filtered = suppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.phone.includes(searchTerm) ||
          supplier.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchTerm, suppliers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://inventory-backend-ajj1.onrender.com/api/supplier",
        {
          headers: {
            // "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );
      setSuppliers(response.data.supplier);
      console.log(response.data.suppl);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("Error fetching suppliers, please try again", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSupplier();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://inventory-backend-ajj1.onrender.com/api/supplier/add",
        formData,
        {
          headers: {
            // "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Supplier add succesfull");
        setAddEditModal(null);

        // fetchCategory();
      } else {
        alert("error  adding supplier. Please try again.");
      }
    } catch (error) {
      alert("error adding supplier", error);
    }
  };
  //   const [supplierEmail, setSupplierEmail] = useState("");
  //   const [Loading, setLoading] = useState(true);
  //   const [editCategory, setEditCategory] = useState(null);

  //   const fetchCategory = async () => {
  //     try {
  //       const response = await axios.get("https://inventory-backend-ajj1.onrender.com/api/category", {
  //         headers: {
  //           // "Content-Type": "application/json",
  //           Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
  //         },
  //       });
  //       setCategories(response.data.categories);
  //       setLoading(false);
  //     } catch (error) {
  //       setLoading(true);
  //       alert("Error fetching catgories, please try again", error);
  //     }
  //   };
  //   useEffect(() => {
  //     fetchCategory();
  //   }, []);

  //   const handleEdit = async (category) => {
  //     setEditCategory(category._id);
  //     setCategoryName(category.categoryName);
  //     setCategoryName(category.categoryDescription);
  //   };
  //   const handleCancel = async () => {
  //     setEditCategory(null);
  //     setCategoryName("");
  //     setCategoryDescription("");
  //   };
  //   if (Loading) return <div>Loading...</div>;
  const supplierColumns = [
    { header: "Supplier Name", field: "name" },
    { header: "Email", field: "email" },
    { header: "Phone Number", field: "phone" },
    { header: "Address", field: "address" },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold"> Supplier Mangement</h1>
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-1 bg-white rounded px-4"
        />
        <button
          className="px-4 py-1.5 bg-blue-500 text-white rounded cursor-pointer"
          onClick={() => setAddEditModal(1)}
        >
          Add Supplier
        </button>
      </div>
      <DataTable
        columns={supplierColumns}
        data={filteredSuppliers}
        loading={Loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-md w-1/3 relative">
            <h1 className="text-xl font-bold">Add Supplier</h1>
            <button
              className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
              onClick={() => setAddEditModal(null)}
            >
              X
            </button>
            <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Supplier Name "
                value={formData.name}
                onChange={handleChange}
                className="border p-1 bg-white rounded px-4"
              />
              <input
                type="email"
                placeholder="Supplier Email "
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="border p-1 bg-white rounded px-4"
              />
              <input
                type="number"
                placeholder="Supplier Phone"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className="border p-1 bg-white rounded px-4"
              />
              <input
                type="text"
                placeholder="Supplier Address "
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="border p-1 bg-white rounded px-4"
              />
              <button
                className="px-4 py-1.5 bg-blue-500 text-white rounded cursor-pointer"
                onClick={() => setAddEditModal(1)}
              >
                Add Supplier
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
