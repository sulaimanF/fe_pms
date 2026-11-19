import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationUnits,
  getAllOrganizationUnits,
} from "@/services/organizationUnit.service";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";
import { assertAccess } from "@/lib/authorization";
import type { AccessRequirement } from "@/lib/authorization";

export const useOrganizationUnits = (complete = false, enabled = true, required:AccessRequirement = []) => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    enabled: session.enabled && enabled,
    queryKey: complete
      ? sessionQueryKey(session.id, "organization-units", "lookup")
      : sessionQueryKey(session.id, "organization-units"),
    queryFn: ({signal}) =>
      requestInSession(
        session.id,
        () => { if(required.length)assertAccess(session.id,required);return complete ? getAllOrganizationUnits(signal) : getOrganizationUnits(undefined,signal); },
      ),
  });
};
