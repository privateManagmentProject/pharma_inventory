import api from "@/api/api";
import type { SalesOrder, SalesOrderFormData } from "../constants/salesOrder";

export const getSalesOrders = async (params?: string) => {
  try {
    const url = params ? `/sales-order?${params}` : "/sales-order";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const getSalesOrderById = async (id: string) => {
  try {
    const response = await api.get(`/sales-order/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const createSalesOrder = async (data: SalesOrderFormData) => {
  try {
    const response = await api.post("/sales-order/add", data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const updateSalesOrder = async (id: string, data: SalesOrder) => {
  try {
    const response = await api.put(`/sales-order/${id}`, data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const updateSalesOrderStatus = async (id: string, status: string) => {
  try {
    const response = await api.put(`/sales-order/${id}/status`, { status });
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const deleteSalesOrder = async (id: string) => {
  try {
    const response = await api.delete(`/sales-order/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
