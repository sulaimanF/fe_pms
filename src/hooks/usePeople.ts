"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useSessionQuery } from "@/hooks/useAuth";
import { useAllOutlets } from "@/hooks/useOutlets";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { ACCESS } from "@/lib/authorization";
import { requestInSession } from "@/lib/session";
import { sessionQueryKey } from "@/lib/queryClient";
import { getPeople, getPeopleById, PEOPLE_API_AVAILABLE } from "@/services/people.services";
import type { PeopleViewModel } from "@/types/people";

export function usePeopleAccess() {
  // View-only shell requires a valid session. People API remains disabled until
  // its contract and operation permissions are verified; lookup guards stay intact.
  return useAuthorization();
}
export function usePeople() {
  const session = useSessionQuery(), access = usePeopleAccess();
  return useQuery<PeopleViewModel[]>({ ...session, queryKey: sessionQueryKey(session.id, "people"),
    queryFn: () => requestInSession(session.id, getPeople), enabled: PEOPLE_API_AVAILABLE && access.allowed && session.enabled });
}
export function usePeopleDetail(id: string) {
  const session = useSessionQuery(), access = usePeopleAccess();
  return useQuery<PeopleViewModel>({ ...session, queryKey: sessionQueryKey(session.id, "people-detail", id),
    queryFn: () => requestInSession(session.id, () => getPeopleById(id)), enabled: PEOPLE_API_AVAILABLE && access.allowed && session.enabled && !!id });
}
export function usePeopleLookups() {
  const access = usePeopleAccess();
  const outletsAllowed = access.allowed && access.can(ACCESS.outletList);
  const organizationsAllowed = access.allowed && access.can(ACCESS.organizationList);
  const outlets = useAllOutlets(outletsAllowed);
  const organizations = useOrganizationUnits(true, organizationsAllowed, ACCESS.organizationList);
  return { outlets, organizations, outletsAllowed, organizationsAllowed };
}
