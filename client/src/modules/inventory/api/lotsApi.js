import apiClient from "@/services/apiClient";

export const lotsApi = {
  getAll: (params) => apiClient.get("/lots", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/lots/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/lots", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/lots/${id}`, data).then((res) => res.data),
  issue: (id, payload) => apiClient.patch(`/lots/${id}/issue`, payload).then((res) => res.data),
};

export default lotsApi;
