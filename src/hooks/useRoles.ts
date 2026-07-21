import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getRoles, deleteRole} from "@/services/role.services";

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
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