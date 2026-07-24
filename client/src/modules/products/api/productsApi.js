import apiClient from "@/services/apiClient";

export const productsApi = {
  getAll: (params) => apiClient.get("/products", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/products/${id}`).then((res) => res.data),
  scanCode: (code) => apiClient.get(`/products/scan/${encodeURIComponent(code)}`).then((res) => res.data),
  create: (data) => apiClient.post("/products", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/products/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/products/${id}`).then((res) => res.data),
  addComponent: (id, data) =>
    apiClient.post(`/products/${id}/components`, data).then((res) => res.data),
  deleteComponent: (id, componentId) =>
    apiClient.delete(`/products/${id}/components/${componentId}`).then((res) => res.data),
  getCosting: (id) => apiClient.get(`/costing/${id}`).then((res) => res.data),
  saveCosting: (id, data) => apiClient.post(`/costing/${id}`, data).then((res) => res.data),
  approveCosting: (id) => apiClient.post(`/costing/${id}/approve`).then((res) => res.data),
};

export default productsApi;
