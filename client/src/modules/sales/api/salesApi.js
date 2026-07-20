import apiClient from "@/services/apiClient";

export const salesApi = {
  getAll: (params) => apiClient.get("/sales", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/sales/${id}`).then((res) => res.data),
  createDirect: (data) => apiClient.post("/sales", data).then((res) => res.data),
  getPdf: (id) => apiClient.get(`/sales/${id}/pdf`, { responseType: "blob" }),
};

export default salesApi;
