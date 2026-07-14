import apiClient from "@/services/apiClient";

export const certificatesApi = {
  getAll: (params) => apiClient.get("/certificates", { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/certificates/${id}`).then((res) => res.data),
  create: (data) => {
    // Check if it's FormData (multipart/form-data for file upload)
    const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
    return apiClient.post("/certificates", data, { headers }).then((res) => res.data);
  },
  delete: (id) => apiClient.delete(`/certificates/${id}`).then((res) => res.data),
};

export default certificatesApi;
