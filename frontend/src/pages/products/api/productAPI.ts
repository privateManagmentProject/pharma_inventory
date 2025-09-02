import api from "@/api/api";
import type { Product } from "../constants/product";

export const GetProductByID = async (
  id: string
): Promise<{ product: Product }> => {
  try {
    const response = await api.get(`/product/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const getProducts = async (params?: string) => {
  try {
    const url = params ? `/product?${params}` : "/product";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const addProduct = async (formData: FormData) => {
  try {
    const response = await api.post("/product/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const updateProduct = async (id: string, formData: FormData) => {
  try {
    const response = await api.put(`/product/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const response = await api.delete(`/product/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
