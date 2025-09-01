import axios from "axios";
import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";

const Suppliers = () => {
  const [addEditModal, setAddEditModal] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tinNumber: "",
    accountName: "",
    accountNumber: "",
    licenses: [],
  });
  const [licenseFiles, setLicenseFiles] = useState([]);
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
          supplier.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.tinNumber.includes(searchTerm)
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

  const handleFileChange = (e) => {
    setLicenseFiles(Array.from(e.target.files));
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/supplier", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });
      setSuppliers(response.data.suppliers);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("Error fetching suppliers, please try again", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Append all form data
      Object.keys(formData).forEach((key) => {
        if (key !== "licenses") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append license files
      licenseFiles.forEach((file) => {
        formDataToSend.append("licenses", file);
      });

      let response;
      if (editSupplier) {
        response = await axios.put(
          `http://localhost:5000/api/supplier/${editSupplier._id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axios.post(
          "http://localhost:5000/api/supplier/add",
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (response.data.success) {
        alert(`Supplier ${editSupplier ? "updated" : "added"} successfully`);
        setAddEditModal(null);
        setEditSupplier(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          tinNumber: "",
          accountName: "",
          accountNumber: "",
          licenses: [],
        });
        setLicenseFiles([]);
        fetchSuppliers();
      } else {
        alert(
          `Error ${
            editSupplier ? "updating" : "adding"
          } supplier. Please try again.`
        );
      }
    } catch (error) {
      alert(`Error ${editSupplier ? "updating" : "adding"} supplier`, error);
    }
  };

  const handleEdit = (supplier) => {
    setEditSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      tinNumber: supplier.tinNumber,
      accountName: supplier.account?.name || "",
      accountNumber: supplier.account?.number || "",
      licenses: supplier.licenses || [],
    });
    setAddEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/api/supplier/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
            },
          }
        );

        if (response.data.success) {
          alert("Supplier deleted successfully");
          fetchSuppliers();
        } else {
          alert("Error deleting supplier");
        }
      } catch (error) {
        alert("Error deleting supplier", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      tinNumber: "",
      accountName: "",
      accountNumber: "",
      licenses: [],
    });
    setLicenseFiles([]);
    setEditSupplier(null);
  };

  const supplierColumns = [
    { header: "Supplier Name", field: "name" },
    { header: "Email", field: "email" },
    { header: "Phone Number", field: "phone" },
    { header: "Address", field: "address" },
    { header: "TIN Number", field: "tinNumber" },
    {
      header: "Account",
      field: "account",
      cell: (item) => `${item.account?.name} - ${item.account?.number}`,
    },
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
          onClick={() => {
            resetForm();
            setAddEditModal(true);
          }}
        >
          Add Supplier
        </button>
      </div>

      <DataTable
        columns={supplierColumns}
        data={filteredSuppliers ?? []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white border-4 rounded-lg shadow relative w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold">
                {editSupplier ? "Edit" : "Add"} Supplier
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
                  <FormField
                    label="Supplier Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Supplier Name"
                    required
                  />
                  <FormField
                    label="Supplier Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Supplier Email"
                    required
                  />
                  <FormField
                    label="Supplier Phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Supplier Phone"
                    required
                  />
                  <FormField
                    label="Supplier Address"
                    name="address"
                    type="textarea"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Supplier Address"
                    required
                  />
                  <FormField
                    label="TIN Number"
                    name="tinNumber"
                    value={formData.tinNumber}
                    onChange={handleChange}
                    placeholder="TIN Number"
                    required
                  />
                  <FormField
                    label="Account Name"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    placeholder="Account Name"
                    required
                  />
                  <FormField
                    label="Account Number"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Account Number"
                    required
                  />
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Licenses (Images)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="border p-2 bg-white rounded px-4 w-full"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Upload license documents (multiple images allowed)
                    </p>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 rounded-b">
                  <button
                    type="submit"
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    {editSupplier ? "Update" : "Add"} Supplier
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

export default Suppliers;
