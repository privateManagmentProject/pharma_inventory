// import { API_BASE_URL } from "../constants";

// class ApiClient {
//   private baseUrl: string;

//   constructor() {
//     this.baseUrl = API_BASE_URL;
//   }

//   async request(endpoint: string, options: RequestInit = {}) {
//     const url = `${this.baseUrl}${endpoint}`;
//     const response = await fetch(url, {
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//       ...options,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     return response.json();
//   }

//   //   get(endpoint: string) {
//   //     return this.request(endpoint);
//   //   }

//   //   post(endpoint: string, data: any) {
//   //     return this.request(endpoint, {
//   //       method: "POST",
//   //       body: JSON.stringify(data),
//   //     });
//   //   }

//   //   put(endpoint: string, data: any) {
//   //     return this.request(endpoint, {
//   //       method: "PUT",
//   //       body: JSON.stringify(data),
//   //     });
//   //   }

//   //   delete(endpoint: string) {
//   //     return this.request(endpoint, {
//   //       method: "DELETE",
//   //     });
//   //   }
// }

// export const apiClient = new ApiClient();

import axios from "axios";
import { API_BASE_URL } from "../constants";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pos-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.withCredentials = true;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pos-token");
      localStorage.removeItem("pos-user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
