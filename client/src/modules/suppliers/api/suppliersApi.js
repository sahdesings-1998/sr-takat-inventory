import apiClient from "@/services/apiClient";

export const suppliersApi = {
  getAll: (params) => apiClient.get("/suppliers", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/suppliers/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/suppliers", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/suppliers/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/suppliers/${id}`).then((res) => res.data),
  recordPayment: (id, data) => apiClient.post(`/suppliers/${id}/payments`, data).then((res) => res.data),
};

export default suppliersApi;
