import api from "@/api/api";
import type { Customer } from "../constants/customer";
export interface ImportCustomerData {
  Customer: string;
  City: string;
  Contact: string;
  "Contact Person": string;
  Remark: string;
}

export const GetCustomerByID = async (id: string): Promise<Customer> => {
  try {
    const response = await api.get(`/customer/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const getCustomers = async (params?: string) => {
  try {
    const url = params ? `/customer?${params}` : "/customer";
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const addCustomer = async (data: Customer) => {
  try {
    const response = await api.post("/customer/add", data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const updateCustomer = async (id: string, data: Customer) => {
  try {
    const response = await api.put(`/customer/${id}`, data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    const response = await api.delete(`/customer/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const importCustomers = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/customer/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds timeout for large files
    });
    return response.data;
  } catch (error: any) {
    console.error("Import API error:", error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(
      "Failed to import customers. Please check the file format and try again."
    );
  }
};

export const importCustomersBulk = async (customers: ImportCustomerData[]) => {
  try {
    const response = await api.post("/customer/import/bulk", { customers });
    return response.data;
  } catch (error: any) {
    console.error("Bulk import API error:", error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to import customers. Please try again.");
  }
};
export const exportCustomers = async () => {
  try {
    const response = await api.get("/customer/export/excel", {
      responseType: "blob",
      timeout: 30000,
    });

    // Check if response is actually a blob
    if (!(response.data instanceof Blob)) {
      throw new Error("Invalid response format from server");
    }

    return response;
  } catch (error: any) {
    console.error("Export API error:", error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to export customers. Please try again.");
  }
};
