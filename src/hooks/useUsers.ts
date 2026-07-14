import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/services/userManagement.services";
import { getUserById } from "@/services/userManagement.services";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};