import apiClient from "@/services/apiClient";

export const purchaseInvoiceApi = {
  getAll: (params) => apiClient.get("/purchase-invoices", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/purchase-invoices/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/purchase-invoices", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/purchase-invoices/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/purchase-invoices/${id}`).then((res) => res.data),
  confirm: (id) => apiClient.post(`/purchase-invoices/${id}/confirm`).then((res) => res.data),
  cancel: (id, data) => apiClient.post(`/purchase-invoices/${id}/cancel`, data).then((res) => res.data),
  recordPayment: (id, data) => apiClient.post(`/purchase-invoices/${id}/payment`, data).then((res) => res.data),
  getPDFBuffer: (id) =>
    apiClient.get(`/purchase-invoices/${id}/pdf`, { responseType: "blob" }).then((res) => res.data),
};

export default purchaseInvoiceApi;
