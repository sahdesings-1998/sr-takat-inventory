import { useQuery } from "@tanstack/react-query";
import reportsApi from "../api/reportsApi";

export function useValuation() {
  return useQuery({
    queryKey: ["reports", "valuation"],
    queryFn: reportsApi.getValuation,
  });
}

export function useRevenues() {
  return useQuery({
    queryKey: ["reports", "revenues"],
    queryFn: reportsApi.getRevenues,
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit", "logs"],
    queryFn: reportsApi.getAuditLogs,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: reportsApi.getDashboard,
  });
}
