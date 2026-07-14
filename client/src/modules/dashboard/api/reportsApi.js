import apiClient from "@/services/apiClient";

export const reportsApi = {
  getValuation: () => apiClient.get("/reports/valuation").then((res) => res.data),
  getRevenues: () => apiClient.get("/reports/revenues").then((res) => res.data),
  getAuditLogs: () => apiClient.get("/audit").then((res) => res.data),
  getDashboard: () => apiClient.get("/reports/dashboard").then((res) => res.data),
};

export default reportsApi;
