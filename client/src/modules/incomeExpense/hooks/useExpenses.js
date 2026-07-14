import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import expenseApi from "../api/expenseApi.js";

export function useExpenses(params = {}) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => expenseApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExpense(id) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: () => expenseApi.getById(id),
    enabled: !!id,
  });
}

export function useExpenseStats(params = {}) {
  return useQuery({
    queryKey: ["expenseStats", params],
    queryFn: () => expenseApi.getStats(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseStats"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => expenseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseStats"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseStats"] });
    },
  });
}

export default {
  useExpenses,
  useExpense,
  useExpenseStats,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
};
