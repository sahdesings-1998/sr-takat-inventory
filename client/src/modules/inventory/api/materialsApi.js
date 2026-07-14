import apiClient from "@/services/apiClient";

export const materialsApi = {
  getAll: (params) => apiClient.get("/materials", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/materials/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/materials", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/materials/${id}`, data).then((res) => res.data),
  adjust: (id, payload) =>
    apiClient.patch(`/materials/${id}/adjust`, payload).then((res) => res.data),
};

export default materialsApi;
