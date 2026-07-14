import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send/receive the httpOnly accessToken/refreshToken cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 401 handling: refresh the access token once, then retry the original request ---
let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config: originalRequest } = error;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh-token");

    if (response?.status !== 401 || isAuthEndpoint || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Another request already triggered a refresh — wait for it, then retry.
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then(() => apiClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      await apiClient.post("/auth/refresh-token");
      resolvePendingQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolvePendingQueue(refreshError);
      // If refresh failed, force a clean logout/redirect to login so the app
      // doesn't keep retrying and the user can re-authenticate.
      try {
        // best-effort: navigate to login page in the browser
        if (typeof window !== "undefined") window.location.href = "/login";
      } catch (e) {
        // noop
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
