import apiClient from "../../../services/apiClient.js";

const BASE_URL = "incomes";

export const incomeApi = {
  getAll: (params = {}) => apiClient.get(BASE_URL, { params }).then((res) => res.data.data),
  getById: (id) => apiClient.get(`${BASE_URL}/${id}`).then((res) => res.data.data),
  create: (data) => apiClient.post(BASE_URL, data).then((res) => res.data.data),
  update: (id, data) => apiClient.put(`${BASE_URL}/${id}`, data).then((res) => res.data.data),
  delete: (id) => apiClient.delete(`${BASE_URL}/${id}`).then((res) => res.data.data),
  getStats: (params = {}) =>
    apiClient.get(`${BASE_URL}/stats`, { params }).then((res) => res.data.data),
};

export default incomeApi;
