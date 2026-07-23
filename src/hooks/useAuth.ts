import { useMutation } from "@tanstack/react-query";
import { logout } from "@/services/auth.services";

export const useLogout = () => {
  return useMutation({
    mutationFn: logout,
  });
};