import apiClient from "@/services/apiClient";

export const notificationsApi = {
  getAll: () => apiClient.get("/notifications").then((res) => res.data),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`).then((res) => res.data),
};

export default notificationsApi;
