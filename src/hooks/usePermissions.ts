import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "@/services/permissions.services";

export const usePermissions = () =>
  useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
  });