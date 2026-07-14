import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import memoApi from "../api/memoApi";

export function useMemos(params) {
  const queryClient = useQueryClient();

  const memosQuery = useQuery({
    queryKey: ["memos", params],
    queryFn: () => memoApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: memoApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
    },
  });

  return {
    memos: memosQuery.data?.data || [],
    isLoading: memosQuery.isLoading,
    isError: memosQuery.isError,
    createMemo: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useMemo(id) {
  const queryClient = useQueryClient();

  const memoQuery = useQuery({
    queryKey: ["memo", id],
    queryFn: () => memoApi.getById(id),
    enabled: !!id,
  });

  const returnItemMutation = useMutation({
    mutationFn: (itemId) => memoApi.returnItem(id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memo", id] });
    },
  });

  const convertItemMutation = useMutation({
    mutationFn: ({ itemId, paymentMethod }) =>
      memoApi.convertItemToSale(id, itemId, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memo", id] });
    },
  });

  const extendMemoMutation = useMutation({
    mutationFn: (expectedReturn) => memoApi.extend(id, expectedReturn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memo", id] });
      queryClient.invalidateQueries({ queryKey: ["memos"] });
    },
  });

  return {
    memo: memoQuery.data?.data,
    isLoading: memoQuery.isLoading,
    isError: memoQuery.isError,
    returnMemoItem: returnItemMutation.mutateAsync,
    convertMemoItem: convertItemMutation.mutateAsync,
    extendMemo: extendMemoMutation.mutateAsync,
  };
}
