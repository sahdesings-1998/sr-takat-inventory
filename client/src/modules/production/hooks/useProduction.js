import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productionApi from "../api/productionApi";

export function useJobCards(params) {
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["jobcards", params],
    queryFn: () => productionApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: productionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobcards"] });
    },
  });

  return {
    jobCards: jobsQuery.data?.data || [],
    isLoading: jobsQuery.isLoading,
    isError: jobsQuery.isError,
    createJobCard: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useJobCard(id) {
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: ["jobcard", id],
    queryFn: () => productionApi.getById(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => productionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobcard", id] });
      queryClient.invalidateQueries({ queryKey: ["jobcards"] });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: (stageData) => productionApi.updateStage(id, stageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobcard", id] });
    },
  });

  const issueMaterialMutation = useMutation({
    mutationFn: (data) => productionApi.issueMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobcard", id] });
    },
  });

  const recordUsageMutation = useMutation({
    mutationFn: (data) => productionApi.recordUsage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobcard", id] });
    },
  });

  const returnMaterialMutation = useMutation({
    mutationFn: (data) => productionApi.returnMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobcard", id] });
    },
  });

  return {
    jobCard: jobQuery.data?.data,
    isLoading: jobQuery.isLoading,
    isError: jobQuery.isError,
    updateJobCard: updateMutation.mutateAsync,
    updateStage: updateStageMutation.mutateAsync,
    issueMaterial: issueMaterialMutation.mutateAsync,
    recordUsage: recordUsageMutation.mutateAsync,
    returnMaterial: returnMaterialMutation.mutateAsync,
  };
}
