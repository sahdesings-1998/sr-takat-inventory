import apiClient from "@/services/apiClient";

export const customersApi = {
  getAll: (params) => apiClient.get("/customers", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/customers/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/customers", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/customers/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/customers/${id}`).then((res) => res.data),
  getHistory: (id) => apiClient.get(`/customers/${id}/history`).then((res) => res.data),
};

export default customersApi;
