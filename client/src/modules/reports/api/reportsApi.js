import apiClient from "@/services/apiClient";

export const reportsApi = {
  getInventoryValuation: (params) => apiClient.get("/reports/inventory-valuation", { params }).then((res) => res.data.data),
  getGemstoneStock: (params) => apiClient.get("/reports/gemstone-stock", { params }).then((res) => res.data.data),
  getJewelleryStock: (params) => apiClient.get("/reports/jewellery-stock", { params }).then((res) => res.data.data),
  getSales: (params) => apiClient.get("/reports/sales", { params }).then((res) => res.data.data),
  getMemo: (params) => apiClient.get("/reports/memo", { params }).then((res) => res.data.data),
  getProductCost: (params) => apiClient.get("/reports/product-cost", { params }).then((res) => res.data.data),
  getStockMovement: (params) => apiClient.get("/reports/stock-movement", { params }).then((res) => res.data.data),
  getSupplierPurchase: (params) => apiClient.get("/reports/supplier-purchase", { params }).then((res) => res.data.data),
  getIncome: (params) => apiClient.get("/reports/income", { params }).then((res) => res.data.data),
  getExpense: (params) => apiClient.get("/reports/expenses", { params }).then((res) => res.data.data),
};
