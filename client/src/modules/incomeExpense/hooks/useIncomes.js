import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import incomeApi from "../api/incomeApi.js";
import { useCallback } from "react";

export function useIncomes(params = {}) {
  return useQuery({
    queryKey: ["incomes", params],
    queryFn: () => incomeApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useIncome(id) {
  return useQuery({
    queryKey: ["income", id],
    queryFn: () => incomeApi.getById(id),
    enabled: !!id,
  });
}

export function useIncomeStats(params = {}) {
  return useQuery({
    queryKey: ["incomeStats", params],
    queryFn: () => incomeApi.getStats(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => incomeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["incomeStats"] });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => incomeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["incomeStats"] });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => incomeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["incomeStats"] });
    },
  });
}

export default {
  useIncomes,
  useIncome,
  useIncomeStats,
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
};
