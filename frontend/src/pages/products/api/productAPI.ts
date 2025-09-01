import api from "@/api/api";

export const GetProductByID = async (id: string): Promise<Product> => {
  try {
    const response = await api.get(`/product/${id}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const getProducts = async () => {
  try {
    const response = await api.get("/product");
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const addProduct = async (data: Product) => {
  try {
    const response = await api.post("/product/add", data);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};
export const updateProduct = async (id: string, data: Product) => {
  try {
    const response = await api.put(`/product/${id}`, data);
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
