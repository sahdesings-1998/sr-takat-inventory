import apiClient from "@/services/apiClient";

export const settingsApi = {
  get: () => apiClient.get("/settings").then((res) => res.data),
  update: (data) => apiClient.put("/settings", data).then((res) => res.data),
};

export default settingsApi;
