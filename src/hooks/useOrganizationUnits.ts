import { useQuery } from "@tanstack/react-query";
import { getOrganizationUnits, getAllOrganizationUnits } from "@/services/organizationUnit.service";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";

export const useOrganizationUnits = (complete = false) => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: complete ? sessionQueryKey(session.id, "organization-units", "lookup") : sessionQueryKey(session.id, "organization-units"),
    queryFn: () => requestInSession(session.id, complete ? getAllOrganizationUnits : getOrganizationUnits),
  });
};
