import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import suppliersApi from "../api/suppliersApi";

export function useSuppliers(params) {
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => suppliersApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => suppliersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  return {
    suppliers: suppliersQuery.data?.data || [],
    isLoading: suppliersQuery.isLoading,
    isError: suppliersQuery.isError,
    error: suppliersQuery.error,
    createSupplier: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSupplier: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteSupplier: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSupplier(id) {
  const queryClient = useQueryClient();

  const supplierQuery = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => suppliersApi.getById(id),
    enabled: !!id,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (paymentData) => suppliersApi.recordPayment(id, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier", id] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  return {
    supplier: supplierQuery.data?.data,
    isLoading: supplierQuery.isLoading,
    isError: supplierQuery.isError,
    recordSupplierPayment: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,
  };
}
