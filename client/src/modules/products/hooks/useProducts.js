import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productsApi from "../api/productsApi";

export function useProducts(params) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });

  return {
    products: productsQuery.data?.data || [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    createProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProduct(id) {
  const queryClient = useQueryClient();

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });

  const costingQuery = useQuery({
    queryKey: ["costing", id],
    queryFn: () => productsApi.getCosting(id),
    enabled: !!id,
  });

  const addComponentMutation = useMutation({
    mutationFn: (data) => productsApi.addComponent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["costing", id] });
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: (componentId) => productsApi.deleteComponent(id, componentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["costing", id] });
    },
  });

  const saveCostingMutation = useMutation({
    mutationFn: (costingData) => productsApi.saveCosting(id, costingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["costing", id] });
    },
  });

  const approveCostingMutation = useMutation({
    mutationFn: () => productsApi.approveCosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["costing", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(id),
    onSuccess: () => {
      // Remove product from cache immediately so any stale references are cleared
      queryClient.removeQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    product: productQuery.data?.data?.product,
    components: productQuery.data?.data?.components || [],
    salesHistory: productQuery.data?.data?.salesHistory || [],
    costing: costingQuery.data?.data,
    isLoading: productQuery.isLoading || costingQuery.isLoading,
    isError: productQuery.isError || costingQuery.isError,
    addComponent: addComponentMutation.mutateAsync,
    isAddingComponent: addComponentMutation.isPending,
    deleteComponent: deleteComponentMutation.mutateAsync,
    saveCosting: saveCostingMutation.mutateAsync,
    approveCosting: approveCostingMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useScanProduct(code) {
  return useQuery({
    queryKey: ["product-scan", code],
    queryFn: () => productsApi.scanCode(code),
    enabled: !!code,
    retry: false,
  });
}
