import apiClient from "@/services/apiClient";

export const productionApi = {
  getAll: (params) => apiClient.get("/job-cards", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/job-cards/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/job-cards", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/job-cards/${id}`, data).then((res) => res.data),
  updateStage: (id, data) =>
    apiClient.patch(`/job-cards/${id}/status`, data).then((res) => res.data),
  issueMaterial: (id, data) =>
    apiClient.post(`/job-cards/${id}/materials-issued`, data).then((res) => res.data),
  returnMaterial: (id, data) =>
    apiClient.post(`/job-cards/${id}/materials-returned`, data).then((res) => res.data),
};

export default productionApi;
