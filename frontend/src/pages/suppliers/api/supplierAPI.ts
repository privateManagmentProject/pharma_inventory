import api from "@/api/api";
import type { Supplier } from "../constants/supplier";

export const GetSupplierByID = async (id: string): Promise<Supplier> => {
  try {
    const response = await api.get(`/supplier/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const getSuppliers = async () => {
  try {
    const response = await api.get("/supplier");
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const addSupplier = async (data: Supplier) => {
  try {
    const response = await api.post("/supplier/add", data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const updateSupplier = async (id: string, data: Supplier) => {
  try {
    const response = await api.put(`/supplier/${id}`, data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    const response = await api.delete(`/supplier/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
