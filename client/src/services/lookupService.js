import apiClient from "./apiClient";

export async function fetchLookups(type) {
  const response = await apiClient.get("/lookups", {
    params: type ? { type } : {},
  });
  return response.data.data;
}

export async function createLookupOption({ type, value, label }) {
  const response = await apiClient.post("/lookups", {
    type,
    value,
    label: label || value,
  });
  return response.data.data;
}

export async function updateLookupOption(id, { value, label }) {
  const response = await apiClient.put(`/lookups/${id}`, {
    value,
    label: label || value,
  });
  return response.data.data;
}

export async function deleteLookupOption(id) {
  const response = await apiClient.delete(`/lookups/${id}`);
  return response.data.data;
}

export default {
  fetchLookups,
  createLookupOption,
  updateLookupOption,
  deleteLookupOption,
};
