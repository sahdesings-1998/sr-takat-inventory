import apiClient from "@/services/apiClient";

export const usersApi = {
  getAll: () => apiClient.get("/users").then((res) => res.data),
  create: (data) => apiClient.post("/users", data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/users/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/users/${id}`).then((res) => res.data),
};

export const rolesApi = {
  getAll: () =>
    apiClient.get("/roles").then((res) => {
      const payload = res.data;
      return Array.isArray(payload?.data) ? payload.data : payload;
    }),
};

export default { usersApi, rolesApi };
