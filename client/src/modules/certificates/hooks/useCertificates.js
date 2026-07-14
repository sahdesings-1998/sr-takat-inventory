import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import certificatesApi from "../api/certificatesApi";

export function useCertificates(params) {
  const queryClient = useQueryClient();

  const certificatesQuery = useQuery({
    queryKey: ["certificates", params],
    queryFn: () => certificatesApi.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: certificatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: certificatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });

  return {
    certificates: certificatesQuery.data?.data || [],
    isLoading: certificatesQuery.isLoading,
    isError: certificatesQuery.isError,
    createCertificate: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteCertificate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
