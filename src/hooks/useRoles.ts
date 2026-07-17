import { useQuery } from "@tanstack/react-query";
import { getRoles } from "@/services/role.services";

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });
};