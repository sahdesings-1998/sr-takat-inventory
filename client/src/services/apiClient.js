import axios from "axios";

const DEFAULT_API_URL = "http://localhost:5000/api/v1";

function normalizeApiBaseUrl(value) {
  if (!value) return "/api/v1";

  const trimmed = value.trim();
  if (!trimmed) return "/api/v1";

  if (/^https?:\/\//i.test(trimmed)) {
    const withoutSlash = trimmed.replace(/\/$/, "");
    return withoutSlash.endsWith("/api/v1") ? withoutSlash : `${withoutSlash}/api/v1`;
  }

  return trimmed.replace(/\/$/, "");
}

const BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? "/api/v1" : DEFAULT_API_URL)
);

const apiClient = axios.create({
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
  "/auth/me",
];

function isAuthEndpoint(url) {
  return AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
}

let isRedirecting = false;

function notifyLogout() {
  if (typeof window !== "undefined") {
    if (isRedirecting) {
      return;
    }
    isRedirecting = true;

    window.dispatchEvent(new CustomEvent("sr-takat:auth-logout"));
    window.location.assign("/login");
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    const originalRequest = error.config;
    const url = originalRequest?.url || "unknown";

    // Log all 401 errors with details
    if (response?.status === 401) {
      console.warn("[auth] 401 unauthorized", { url });
    }

    // Don't redirect on 401 for auth endpoints (including session checks)
    if (response?.status === 401 && isAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    // Redirect on 401 only for protected API endpoints
    if (response?.status === 401 && !isAuthEndpoint(url)) {
      console.warn("[auth] session expired, redirecting to login", { url });
      notifyLogout();
      return Promise.reject(error);
    }

    if (response?.status && response.status >= 400) {
      console.error("[auth] request error", {
        url,
        status: response.status,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;

