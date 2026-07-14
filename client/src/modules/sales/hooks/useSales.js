import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import salesApi from "../api/salesApi";

export function useSales(params) {
  const queryClient = useQueryClient();

  const salesQuery = useQuery({
    queryKey: ["sales", params],
    queryFn: () => salesApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: salesApi.createDirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  return {
    sales: salesQuery.data?.data || [],
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
    createSale: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useSale(id) {
  const salesQuery = useQuery({
    queryKey: ["sale", id],
    queryFn: () => salesApi.getById(id),
    enabled: !!id,
  });

  return {
    sale: salesQuery.data?.data?.sale,
    items: salesQuery.data?.data?.items || [],
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
  };
}
