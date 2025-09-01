import api from "@/api/api";
import type { Category } from "../constants/catgory";

export const GetCategoryByID = async (id: string): Promise<Category> => {
  try {
    const response = await api.get(`/category/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const getCategories = async () => {
  try {
    const response = await api.get("/category");
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const addCategory = async (data: Category) => {
  try {
    const response = await api.post("/category/add", data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const updateCategory = async (id: string, data: Category) => {
  try {
    const response = await api.put(`/category/${id}`, data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const response = await api.delete(`/category/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
