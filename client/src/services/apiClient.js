import axios from "axios";

const DEFAULT_API_URL = "http://localhost:5000/api/v1";
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/api/v1`
    : DEFAULT_API_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send/receive the httpOnly accessToken/refreshToken cookies
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh-token",
];

function isAuthEndpoint(url) {
  return AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
}

let isRefreshing = false;
let pendingQueue = [];
let refreshPromise = null;

function resolvePendingQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

function notifyLogout() {
  if (typeof window !== "undefined") {
    refreshClient.post("/auth/logout").catch(() => {
      // best-effort cookie cleanup on the server
    });
    window.dispatchEvent(new CustomEvent("sr-takat:auth-logout"));
    window.location.href = "/login";
  }
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh-token")
      .then((response) => {
        refreshPromise = null;
        return response;
      })
      .catch((error) => {
        refreshPromise = null;
        throw error;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error.response;
    const originalRequest = error.config;

    if (!response || response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url;
    if (isAuthEndpoint(requestUrl) || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then(() => apiClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      await refreshAccessToken();
      resolvePendingQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolvePendingQueue(refreshError);
      notifyLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
