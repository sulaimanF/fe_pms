import { useQuery } from "@tanstack/react-query";
import { getOutlets } from "@/services/outlet.service";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";

export const useOutlets = (
  organizationUnitId?: number
) => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "outlets", organizationUnitId),
    queryFn: () => requestInSession(session.id, () => getOutlets(organizationUnitId)),
    enabled: session.enabled && !!organizationUnitId,
  });
};

export const useAllOutlets = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "outlets"),
    queryFn: () => requestInSession(session.id, () => getOutlets()),
  });
};
