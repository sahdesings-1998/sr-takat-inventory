import apiClient from "@/services/apiClient";

/**
 * Simple authentication API calls.
 * Cookies (accessToken) are set by the server and sent automatically.
 */
export const authApi = {
  register: (payload) => apiClient.post("/auth/register", payload).then((res) => res.data.data),
  login: (payload) => apiClient.post("/auth/login", payload).then((res) => res.data.data),
  logout: () => apiClient.post("/auth/logout").then((res) => res.data.data),
  getMe: () => apiClient.get("/auth/me").then((res) => res.data.data),
  forgotPassword: (payload) => apiClient.post("/auth/forgot-password", payload).then((res) => res.data.data),
  resetPassword: (payload) => apiClient.post("/auth/reset-password", payload).then((res) => res.data.data),
};

export default authApi;

