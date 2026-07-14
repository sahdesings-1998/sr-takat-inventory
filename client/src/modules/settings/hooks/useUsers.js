import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, rolesApi } from "../api/usersApi";

export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    users: usersQuery.data?.data || [],
    roles: rolesQuery.data?.data || [],
    isLoading: usersQuery.isLoading || rolesQuery.isLoading,
    isError: usersQuery.isError || rolesQuery.isError,
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
