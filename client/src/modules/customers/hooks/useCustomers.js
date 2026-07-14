import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import customersApi from "../api/customersApi";

export function useCustomers(params) {
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return {
    customers: customersQuery.data?.data || [],
    isLoading: customersQuery.isLoading,
    isError: customersQuery.isError,
    error: customersQuery.error,
    createCustomer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCustomer: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCustomer: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCustomer(id) {
  const queryClient = useQueryClient();

  const customerQuery = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.getById(id),
    enabled: !!id,
  });

  const historyQuery = useQuery({
    queryKey: ["customerHistory", id],
    queryFn: () => customersApi.getHistory(id),
    enabled: !!id,
  });

  return {
    customer: customerQuery.data?.data,
    isLoading: customerQuery.isLoading,
    isError: customerQuery.isError,
    history: historyQuery.data?.data,
    isHistoryLoading: historyQuery.isLoading,
  };
}
