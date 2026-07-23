import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import purchaseInvoiceApi from "../api/purchaseInvoiceApi";

export function usePurchaseInvoices(params) {
  const query = useQuery({
    queryKey: ["purchaseInvoices", params],
    queryFn: () => purchaseInvoiceApi.getAll(params),
  });

  return {
    invoices: query.data?.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePurchaseInvoice(id) {
  const queryClient = useQueryClient();

  const invoiceQuery = useQuery({
    queryKey: ["purchaseInvoice", id],
    queryFn: () => purchaseInvoiceApi.getById(id),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => purchaseInvoiceApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoice", id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (data) => purchaseInvoiceApi.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoice", id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data) => purchaseInvoiceApi.recordPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoice", id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => purchaseInvoiceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
  });

  return {
    invoice: invoiceQuery.data?.data,
    isLoading: invoiceQuery.isLoading,
    isError: invoiceQuery.isError,
    confirmInvoice: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    cancelInvoice: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    recordPayment: paymentMutation.mutateAsync,
    isRecordingPayment: paymentMutation.isPending,
    deleteInvoice: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: purchaseInvoiceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
  });

  return {
    createInvoice: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdatePurchaseInvoice(id) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => purchaseInvoiceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoice", id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoices"] });
    },
  });

  return {
    updateInvoice: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
