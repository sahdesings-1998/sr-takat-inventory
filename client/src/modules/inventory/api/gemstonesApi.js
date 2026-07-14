import apiClient from "@/services/apiClient";

export const gemstonesApi = {
  getAll: (params) => apiClient.get("/gemstones", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/gemstones/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/gemstones", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/gemstones/${id}`, data).then((res) => res.data),
  updateStatus: (id, payload) =>
    apiClient.patch(`/gemstones/${id}/status`, payload).then((res) => res.data),
  delete: (id) => apiClient.delete(`/gemstones/${id}`).then((res) => res.data),
};

export default gemstonesApi;
