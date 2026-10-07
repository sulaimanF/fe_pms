import { useQuery } from "@tanstack/react-query";
import { getMenuTree } from "@/services/menu.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";

export const useMenuTree = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "menu-tree"),
    queryFn: () => requestInSession(session.id, getMenuTree),
  });
};
