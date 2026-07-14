import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import gemstonesApi from "../api/gemstonesApi";
import lotsApi from "../api/lotsApi";
import materialsApi from "../api/materialsApi";

export function useGemstones(params) {
  const queryClient = useQueryClient();

  const gemstonesQuery = useQuery({
    queryKey: ["gemstones", params],
    queryFn: () => gemstonesApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: gemstonesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => gemstonesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
      queryClient.invalidateQueries({ queryKey: ["gemstone"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gemstonesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks }) => gemstonesApi.updateStatus(id, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
      queryClient.invalidateQueries({ queryKey: ["gemstone"] });
    },
  });

  return {
    gemstones: gemstonesQuery.data?.data || [],
    isLoading: gemstonesQuery.isLoading,
    isError: gemstonesQuery.isError,
    createGemstone: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateGemstone: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteGemstone: deleteMutation.mutateAsync,
    updateGemstoneStatus: updateStatusMutation.mutateAsync,
  };
}

export function useLots(params) {
  const queryClient = useQueryClient();

  const lotsQuery = useQuery({
    queryKey: ["lots", params],
    queryFn: () => lotsApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: lotsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => lotsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
    },
  });

  const issueMutation = useMutation({
    mutationFn: ({ id, carat }) => lotsApi.issue(id, { carat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
    },
  });

  return {
    lots: lotsQuery.data?.data || [],
    isLoading: lotsQuery.isLoading,
    isError: lotsQuery.isError,
    createLot: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateLot: updateMutation.mutateAsync,
    issueFromLot: issueMutation.mutateAsync,
  };
}

export function useMaterials(params) {
  const queryClient = useQueryClient();

  const materialsQuery = useQuery({
    queryKey: ["materials", params],
    queryFn: () => materialsApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: materialsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => materialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantityChange, remarks }) =>
      materialsApi.adjust(id, { quantityChange, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  return {
    materials: materialsQuery.data?.data || [],
    isLoading: materialsQuery.isLoading,
    isError: materialsQuery.isError,
    createMaterial: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMaterial: updateMutation.mutateAsync,
    adjustMaterialStock: adjustMutation.mutateAsync,
  };
}
