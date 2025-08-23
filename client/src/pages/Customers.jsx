import axios from "axios";
import jsPDF from "jspdf";
import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";

const Customers = () => {
  const [addEditModal, setAddEditModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    companyName: "",
    tinNumber: "",
    phone: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    withhold: false,
    licenses: [],
  });
  const [licenseFiles, setLicenseFiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.companyName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm) ||
          customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.tinNumber.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setLicenseFiles(Array.from(e.target.files));
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://inventory-backend-ajj1.onrender.com/api/customer",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );
      setCustomers(response.data.customers);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("Error fetching customers, please try again", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (id) => {
    try {
      const response = await axios.get(
        `https://inventory-backend-ajj1.onrender.com/api/customer/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );
      return response.data.customer;
    } catch (error) {
      alert("Error fetching customer details, please try again", error);
      return null;
    }
  };

  useEffect(() => {
    fetchCustomers();
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
      if (editCustomer) {
        response = await axios.put(
          `https://inventory-backend-ajj1.onrender.com/api/customer/${editCustomer._id}`,
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
          "https://inventory-backend-ajj1.onrender.com/api/customer/add",
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
        alert(`Customer ${editCustomer ? "updated" : "added"} successfully`);
        setAddEditModal(null);
        setEditCustomer(null);
        setFormData({
          name: "",
          address: "",
          companyName: "",
          tinNumber: "",
          phone: "",
          receiverName: "",
          receiverPhone: "",
          receiverAddress: "",
          withhold: false,
          licenses: [],
        });
        setLicenseFiles([]);
        fetchCustomers();
      } else {
        alert(
          `Error ${
            editCustomer ? "updating" : "adding"
          } customer. Please try again.`
        );
      }
    } catch (error) {
      alert(`Error ${editCustomer ? "updating" : "adding"} customer`, error);
    }
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setFormData({
      name: customer.name,
      address: customer.address,
      companyName: customer.companyName,
      tinNumber: customer.tinNumber,
      phone: customer.phone,
      receiverName: customer.receiverInfo?.name || "",
      receiverPhone: customer.receiverInfo?.phone || "",
      receiverAddress: customer.receiverInfo?.address || "",
      withhold: customer.withhold || false,
      licenses: customer.licenses || [],
    });
    setAddEditModal(true);
  };

  const handleView = async (customer) => {
    const customerDetail = await fetchCustomerDetail(customer._id);
    if (customerDetail) {
      setDetailCustomer(customerDetail);
      setDetailModal(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        const response = await axios.delete(
          `https://inventory-backend-ajj1.onrender.com/api/customer/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
            },
          }
        );

        if (response.data.success) {
          alert("Customer deleted successfully");
          fetchCustomers();
        } else {
          alert("Error deleting customer");
        }
      } catch (error) {
        alert("Error deleting customer", error);
      }
    }
  };

  const generatePDF = (customer) => {
    const doc = new jsPDF();

    // Add company header
    doc.setFontSize(20);
    doc.text("Pharma Company", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text("Customer Details", 105, 25, { align: "center" });

    // Add customer details
    doc.setFontSize(10);
    doc.text(`Customer ID: ${customer._id.slice(-6)}`, 20, 40);
    doc.text(`Name: ${customer.name}`, 20, 47);
    doc.text(`Company: ${customer.companyName}`, 20, 54);
    doc.text(`Phone: ${customer.phone}`, 20, 61);
    doc.text(`Address: ${customer.address}`, 20, 68);
    doc.text(`TIN Number: ${customer.tinNumber}`, 20, 75);
    doc.text(`Withhold Tax: ${customer.withhold ? "Yes" : "No"}`, 20, 82);

    // Add receiver info
    doc.text("Receiver Information:", 20, 92);
    doc.text(`Name: ${customer.receiverInfo?.name || "N/A"}`, 20, 99);
    doc.text(`Phone: ${customer.receiverInfo?.phone || "N/A"}`, 20, 106);
    doc.text(`Address: ${customer.receiverInfo?.address || "N/A"}`, 20, 113);

    // Add licenses info
    doc.text(`Licenses: ${customer.licenses?.length || 0} files`, 20, 123);

    // Save the PDF
    doc.save(`customer-${customer._id.slice(-6)}.pdf`);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      companyName: "",
      tinNumber: "",
      phone: "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      withhold: false,
      licenses: [],
    });
    setLicenseFiles([]);
    setEditCustomer(null);
  };

  const customerColumns = [
    { header: "Customer Name", field: "name" },
    { header: "Company", field: "companyName" },
    { header: "Phone Number", field: "phone" },
    { header: "Address", field: "address" },
    { header: "TIN Number", field: "tinNumber" },
    {
      header: "Receiver Info",
      field: "receiverInfo",
      cell: (item) =>
        `${item.receiverInfo?.name} - ${item.receiverInfo?.phone}`,
    },
    {
      header: "Withhold",
      field: "withhold",
      cell: (item) => (item.withhold ? "Yes" : "No"),
    },
    {
      header: "Actions",
      field: "_id",
      cell: (item) => (
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white p-1 rounded-md hover:bg-blue-600 text-xs"
            onClick={() => handleView(item)}
          >
            View
          </button>
          <button
            className="bg-green-500 text-white p-1 rounded-md hover:bg-green-600 text-xs"
            onClick={() => handleEdit(item)}
          >
            Edit
          </button>
          <button
            className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 text-xs"
            onClick={() => handleDelete(item._id)}
          >
            Delete
          </button>
          <button
            className="bg-gray-500 text-white p-1 rounded-md hover:bg-gray-600 text-xs"
            onClick={() => generatePDF(item)}
          >
            Download
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Customer Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <input
          type="text"
          placeholder="Search customers..."
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
          Add Customer
        </button>
      </div>

      <DataTable
        columns={customerColumns}
        data={filteredCustomers}
        // onEdit={handleEdit}
        // onDelete={handleDelete}
        loading={loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white border-4 rounded-lg shadow relative w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold">
                {editCustomer ? "Edit" : "Add"} Customer
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
                    label="Customer Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Customer Name"
                    required
                  />
                  <FormField
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Company Name"
                    required
                  />
                  <FormField
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Address"
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
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    required
                  />
                  <FormField
                    label="Receiver Name"
                    name="receiverName"
                    value={formData.receiverName}
                    onChange={handleChange}
                    placeholder="Receiver Name"
                    required
                  />
                  <FormField
                    label="Receiver Phone"
                    name="receiverPhone"
                    type="tel"
                    value={formData.receiverPhone}
                    onChange={handleChange}
                    placeholder="Receiver Phone"
                    required
                  />
                  <FormField
                    label="Receiver Address"
                    name="receiverAddress"
                    value={formData.receiverAddress}
                    onChange={handleChange}
                    placeholder="Receiver Address"
                    required
                  />
                  <div className="col-span-6 flex items-center">
                    <input
                      type="checkbox"
                      name="withhold"
                      checked={formData.withhold}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-900">
                      Withhold Tax
                    </label>
                  </div>
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
                    {editCustomer ? "Update" : "Add"} Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detailModal && detailCustomer && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white border-4 rounded-lg shadow relative w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold">Customer Details</h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={() => {
                  setDetailModal(null);
                  setDetailCustomer(null);
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {detailCustomer.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {detailCustomer.companyName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {detailCustomer.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    TIN Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {detailCustomer.tinNumber}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {detailCustomer.address}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Withhold Tax
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {detailCustomer.withhold ? "Yes" : "No"}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Receiver Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {detailCustomer.receiverInfo?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {detailCustomer.receiverInfo?.phone || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {detailCustomer.receiverInfo?.address || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Licenses
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {detailCustomer.licenses &&
                    detailCustomer.licenses.length > 0 ? (
                      detailCustomer.licenses.map((license, index) => (
                        <div key={index} className="relative">
                          <img
                            src={`https://inventory-backend-ajj1.onrender.com/${license}`}
                            alt={`License ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <a
                            href={`https://inventory-backend-ajj1.onrender.com/${license}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded text-xs"
                          >
                            View Full
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        No licenses uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={() => generatePDF(detailCustomer)}
                >
                  Download Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
