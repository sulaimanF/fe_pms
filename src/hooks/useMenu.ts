import { useQuery } from "@tanstack/react-query";
import { getMenuTree } from "@/services/menu.services";

export const useMenuTree = () =>
  useQuery({
    queryKey: ["menu-tree"],
    queryFn: getMenuTree,
  });