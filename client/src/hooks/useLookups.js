import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLookups, createLookupOption, deleteLookupOption } from "@/services/lookupService";

export function useLookups(type) {
  const query = useQuery({
    queryKey: ["lookups", type],
    queryFn: () => fetchLookups(type),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    select: (data) =>
      (data || []).map((item) => ({
        value: item.value,
        label: item.label || item.value,
        _id: item._id,
        isSystem: item.isSystem,
      })),
  });

  return {
    options: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateLookup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ type, value, label }) => createLookupOption({ type, value, label }),
    onSuccess: (data, variables) => {
      if (variables?.type) {
        queryClient.invalidateQueries({ queryKey: ["lookups", variables.type] });
      }
      queryClient.invalidateQueries({ queryKey: ["lookups"] });
    },
  });

  return {
    createLookup: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteLookup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id) => deleteLookupOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups"] });
    },
  });

  return {
    deleteLookup: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

export default useLookups;
