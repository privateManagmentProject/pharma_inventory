import axios from "axios";

const API_URL = "https://inventory-backend-ajj1.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
  },
});

// Update headers with token before each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pos-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Supplier API calls
export const getSuppliers = async () => {
  try {
    const response = await api.get("/supplier");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching suppliers");
  }
};

export const addSupplier = async (data) => {
  try {
    const response = await api.post("/supplier/add", data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error adding supplier");
  }
};
export const getCategories = async () => {
  try {
    const response = await api.get("/category");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching categories");
  }
};

export const addCatgory = async (data) => {
  try {
    const response = await api.post("/category/add", data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error adding catagory");
  }
};

// Product API calls
export const getProducts = async (params = {}) => {
  try {
    const response = await api.get("/product", { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching products");
  }
};

export const addProduct = async (data) => {
  try {
    const response = await api.post("/product/add", data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error adding product");
  }
};

export const updateProduct = async (id, data) => {
  try {
    const response = await api.put(`/product/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating product");
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/product/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deleting product");
  }
};

// Sales Order API calls
export const getSalesOrders = async (params = {}) => {
  try {
    const response = await api.get("/sales-order", { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching sales orders");
  }
};

export const addSalesOrder = async (data) => {
  try {
    const response = await api.post("/sales-order/add", data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating sales order");
  }
};

export const updateSalesOrder = async (id, data) => {
  try {
    const response = await api.put(`/sales-order/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating sales order");
  }
};

export const updateSalesOrderStatus = async (id, status) => {
  try {
    const response = await api.put(`/sales-order/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating sales order status");
  }
};

export default api;