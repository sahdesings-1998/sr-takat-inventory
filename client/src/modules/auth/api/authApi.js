import apiClient from "@/services/apiClient";

/**
 * Simple authentication API calls.
 * Cookies (accessToken) are set by the server and sent automatically.
 */
export const authApi = {
  register: (payload) => apiClient.post("/auth/register", payload).then((res) => res.data),
  login: (payload) => apiClient.post("/auth/login", payload).then((res) => res.data),
  logout: () => apiClient.post("/auth/logout").then((res) => res.data),
  getMe: () => apiClient.get("/auth/me").then((res) => res.data),
  forgotPassword: (payload) => apiClient.post("/auth/forgot-password", payload).then((res) => res.data),
  resetPassword: (payload) => apiClient.post("/auth/reset-password", payload).then((res) => res.data),
};

export default authApi;

