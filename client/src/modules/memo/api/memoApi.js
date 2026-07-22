import apiClient from "@/services/apiClient";

export const memoApi = {
  getAll: (params) => apiClient.get("/memos", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/memos/${id}`).then((res) => res.data),
  create: (data) => apiClient.post("/memos", data).then((res) => res.data),
  returnItem: (id, itemId) =>
    apiClient.patch(`/memos/${id}/items/${itemId}/return`).then((res) => res.data),
  convertItemToSale: (id, itemId, payload) =>
    apiClient.patch(`/memos/${id}/items/${itemId}/sale`, payload).then((res) => res.data),
  extend: (id, data) =>
    apiClient.patch(`/memos/${id}/extend`, data).then((res) => res.data),
};

export default memoApi;
