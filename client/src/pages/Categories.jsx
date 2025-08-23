import axios from "axios";
import React, { useEffect, useState } from "react";
import ActionHeader from "../components/ActionHeader";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import Toast from "../components/Toast";
const Categories = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCategory, setEditCategory] = useState(null);
  const [addEditModal, setAddEditModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };
  const fetchCategory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://inventory-backend-ajj1.onrender.com/api/category",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );
      setCategories(response.data.categories);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showToast(error, "Error fetching categories, please try again");
    }
  };

  useEffect(() => {
    fetchCategory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editCategory
        ? `https://inventory-backend-ajj1.onrender.com/api/category/${editCategory}`
        : "https://inventory-backend-ajj1.onrender.com/api/category/add";

      const method = editCategory ? "put" : "post";

      const response = await axios[method](
        url,
        { categoryName, categoryDescription },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      if (response.data.success) {
        showToast(
          "success",
          `Category ${editCategory ? "updated" : "added"} successfully`
        );
        setAddEditModal(null);
        setEditCategory(null);
        setCategoryName("");
        setCategoryDescription("");
        fetchCategory();
      } else {
        showToast(
          "error",
          `Error ${
            editCategory ? "updating" : "adding"
          } category. Please try again.`
        );
      }
    } catch (error) {
      showToast(
        error,
        `Error ${editCategory ? "updating" : "adding"} category`
      );
    }
  };

  const handleEdit = (category) => {
    setEditCategory(category._id);
    setCategoryName(category.categoryName);
    setCategoryDescription(category.categoryDescription);
    setAddEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const response = await axios.delete(
          `https://inventory-backend-ajj1.onrender.com/api/category/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
            },
          }
        );

        if (response.data.success) {
          showToast("success", "Category deleted successfully");
          fetchCategory();
        } else {
          showToast("error", "Error deleting category");
        }
      } catch (error) {
        showToast(error, "Error deleting category");
      }
    }
  };
  const resetForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setEditCategory(null);
  };

  const categoryColumns = [
    { header: "Category Name", field: "categoryName" },
    { header: "Description", field: "categoryDescription" },
  ];

  // Filter categories based on search term
  const filteredCategories = categories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.categoryDescription
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ show: false })}
        />
      )}
      <h1 className="text-2xl font-bold">Category Management</h1>

      <div className="relative bg-white shadow-md dark:bg-gray-800 sm:rounded-lg">
        <ActionHeader
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onAdd={() => {
            resetForm();
            setAddEditModal(true);
          }}
          addButtonText="Add Category"
        />
      </div>

      <DataTable
        columns={categoryColumns}
        data={filteredCategories}
        onEdit={handleEdit}
        onDelete={(category) => handleDelete(category._id)}
        loading={loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white border-4 rounded-lg shadow relative w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b rounded-t">
              <h3 className="text-xl font-semibold">
                {editCategory ? "Edit" : "Add"} Category
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
                <div className="grid grid-cols-1 grid-rows-1 gap-6">
                  <FormField
                    label="Category Name"
                    name="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Category Name"
                    required
                  />
                  <FormField
                    label="Category Description"
                    name="categoryDescription"
                    type="textarea"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Category Description"
                    required
                  />
                </div>
                <div className="p-6 border-t border-gray-200 rounded-b">
                  <button
                    type="submit"
                    className="text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    {editCategory ? "Update" : "Add"} Category
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

export default Categories;
