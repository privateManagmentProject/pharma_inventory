import api from "@/api/api";

export const GetCustomerByID = async (id: string): Promise<Customer> => {
  try {
    const response = await api.get(`/customer/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const getCustomers = async () => {
  try {
    const response = await api.get("/customer");
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
