import { useQuery } from "@tanstack/react-query";
import { getOrganizationUnits } from "@/services/organizationUnit.service";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";

export const useOrganizationUnits = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "organization-units"),
    queryFn: () => requestInSession(session.id, getOrganizationUnits),
  });
};
