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
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["gemstones font"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, expectedReturn, reason }) => memoApi.extend(id, { expectedReturn, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
    },
  });

  const returnItemMutation = useMutation({
    mutationFn: ({ memoId, itemId }) => memoApi.returnItem(memoId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const convertItemMutation = useMutation({
    mutationFn: ({ memoId, itemId, paymentMethod }) => memoApi.convertItemToSale(memoId, itemId, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const dataPayload = memosQuery.data?.data;
  const memosList = Array.isArray(dataPayload) ? dataPayload : (dataPayload?.memos || []);
  const metrics = dataPayload?.metrics || {};

  return {
    memos: memosList,
    metrics,
    isLoading: memosQuery.isLoading,
    isError: memosQuery.isError,
    createMemo: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    extendMemo: extendMutation.mutateAsync,
    returnMemoItem: returnItemMutation.mutateAsync,
    convertMemoItem: convertItemMutation.mutateAsync,
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
      queryClient.invalidateQueries({ queryKey: ["memos"] });
    },
  });

  const convertItemMutation = useMutation({
    mutationFn: ({ itemId, paymentMethod }) =>
      memoApi.convertItemToSale(id, itemId, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memo", id] });
      queryClient.invalidateQueries({ queryKey: ["memos"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  const extendMemoMutation = useMutation({
    mutationFn: ({ expectedReturn, reason }) => memoApi.extend(id, { expectedReturn, reason }),
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
