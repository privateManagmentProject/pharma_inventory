import axios from "axios";
import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";

const Categories = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCategory, setEditCategory] = useState(null);
  const [addEditModal, setAddEditModal] = useState(null);

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
      alert("Error fetching categories, please try again", error);
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
        alert(`Category ${editCategory ? "updated" : "added"} successfully`);
        setAddEditModal(null);
        setEditCategory(null);
        setCategoryName("");
        setCategoryDescription("");
        fetchCategory();
      } else {
        alert(
          `Error ${
            editCategory ? "updating" : "adding"
          } category. Please try again.`
        );
      }
    } catch (error) {
      alert(`Error ${editCategory ? "updating" : "adding"} category`, error);
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
          alert("Category deleted successfully");
          fetchCategory();
        } else {
          alert("Error deleting category");
        }
      } catch (error) {
        alert("Error deleting category", error);
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

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Category Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search categories..."
            className="border p-2 bg-white rounded px-4 w-full"
            // onChange={(e) => {
            //   // Add search functionality if needed
            // }}
          />
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer w-full md:w-auto"
          onClick={() => {
            resetForm();
            setAddEditModal(true);
          }}
        >
          Add Category
        </button>
      </div>

      <DataTable
        columns={categoryColumns}
        data={categories}
        onEdit={handleEdit}
        onDelete={(category) => handleDelete(category._id)}
        loading={loading}
        hasCheckbox={false}
      />

      {addEditModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-md max-h-screen overflow-y-auto relative">
            <h1 className="text-xl font-bold">
              {editCategory ? "Edit" : "Add"} Category
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
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Category Name</label>
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="border p-2 rounded"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Category Description</label>
                  <input
                    type="text"
                    placeholder="Category Description"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="border p-2 rounded"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer mt-4"
              >
                {editCategory ? "Update" : "Add"} Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
