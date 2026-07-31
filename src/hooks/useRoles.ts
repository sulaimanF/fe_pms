import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getRoles, getRoleById, deleteRole} from "@/services/role.services";

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });
};

export const useRole = (id?: number | string) => {
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id!),
    enabled: !!id,
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["roles"],
      });
    },
  });
};