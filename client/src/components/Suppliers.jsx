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
  const [loading, setLoading] = useState(true);
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
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );
      setSuppliers(response.data.supplier);
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
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Supplier added successfully");
        setAddEditModal(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
        });
        fetchSupplier();
      } else {
        alert("Error adding supplier. Please try again.");
      }
    } catch (error) {
      alert("Error adding supplier", error);
    }
  };

  const supplierColumns = [
    { header: "Supplier Name", field: "name" },
    { header: "Email", field: "email" },
    { header: "Phone Number", field: "phone" },
    { header: "Address", field: "address" },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Supplier Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 bg-white rounded px-4 w-full md:w-auto"
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer w-full md:w-auto mt-2 md:mt-0"
          onClick={() => setAddEditModal(true)}
        >
          Add Supplier
        </button>
      </div>

      <DataTable
        columns={supplierColumns}
        data={filteredSuppliers}
        loading={loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-md relative">
            <h1 className="text-xl font-bold">Add Supplier</h1>
            <button
              className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
              onClick={() => setAddEditModal(null)}
            >
              X
            </button>
            <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Supplier Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Supplier Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Supplier Email</label>
                <input
                  type="email"
                  placeholder="Supplier Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Supplier Phone</label>
                <input
                  type="tel"
                  placeholder="Supplier Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">Supplier Address</label>
                <input
                  type="text"
                  placeholder="Supplier Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer mt-4"
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
