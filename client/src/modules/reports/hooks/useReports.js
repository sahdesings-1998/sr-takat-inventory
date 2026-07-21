import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reportsApi";

export function useInventoryValuation(params) {
  return useQuery({
    queryKey: ["reports", "inventory-valuation", params],
    queryFn: () => reportsApi.getInventoryValuation(params),
    keepPreviousData: true,
  });
}

export function useGemstoneStockReport(params) {
  return useQuery({
    queryKey: ["reports", "gemstone-stock", params],
    queryFn: () => reportsApi.getGemstoneStock(params),
    keepPreviousData: true,
  });
}

export function useJewelleryStockReport(params) {
  return useQuery({
    queryKey: ["reports", "jewellery-stock", params],
    queryFn: () => reportsApi.getJewelleryStock(params),
    keepPreviousData: true,
  });
}

export function useSalesReport(params) {
  return useQuery({
    queryKey: ["reports", "sales", params],
    queryFn: () => reportsApi.getSales(params),
    keepPreviousData: true,
  });
}

export function useMemoReport(params) {
  return useQuery({
    queryKey: ["reports", "memo", params],
    queryFn: () => reportsApi.getMemo(params),
    keepPreviousData: true,
  });
}

export function useProductCostReport(params) {
  return useQuery({
    queryKey: ["reports", "product-cost", params],
    queryFn: () => reportsApi.getProductCost(params),
    keepPreviousData: true,
  });
}

export function useStockMovementReport(params) {
  return useQuery({
    queryKey: ["reports", "stock-movement", params],
    queryFn: () => reportsApi.getStockMovement(params),
    keepPreviousData: true,
  });
}

export function useSupplierPurchaseReport(params) {
  return useQuery({
    queryKey: ["reports", "supplier-purchase", params],
    queryFn: () => reportsApi.getSupplierPurchase(params),
    keepPreviousData: true,
  });
}

export function useIncomeReport(params) {
  return useQuery({
    queryKey: ["reports", "income", params],
    queryFn: () => reportsApi.getIncome(params),
    keepPreviousData: true,
  });
}

export function useExpenseReport(params) {
  return useQuery({
    queryKey: ["reports", "expense", params],
    queryFn: () => reportsApi.getExpense(params),
    keepPreviousData: true,
  });
}
