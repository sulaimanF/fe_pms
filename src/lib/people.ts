import type { AuthRole } from "@/types/auth";
import type { OrganizationUnit } from "@/types/organizationUnit";
import type { PeopleFilters, PeopleInquiryResult, PeopleInquiryState, PeopleViewModel } from "@/types/people";

export function peopleSuperAdminExpiry(roles: readonly AuthRole[], now = Date.now()) {
  return Math.max(-Infinity, ...roles.filter(role => role.code === "super-admin" && role.is_active === true && role.pivot?.is_active === true && role.pivot.scope_type === null && role.pivot.scope_id === null).map(role => {
    const value = role.pivot?.expires_at;
    if (value == null) return Infinity;
    const expiry = Date.parse(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value.replace(" ", "T") + "+07:00" : value);
    return Number.isFinite(expiry) && expiry > now ? expiry : -Infinity;
  }));
}
export function findPeopleRegion(organizationId: number, units: readonly OrganizationUnit[]) {
  const byId = new Map(units.map(unit => [unit.id, unit]));
  const visited = new Set<number>();
  let id: number | null = organizationId;
  while (id !== null && !visited.has(id)) {
    visited.add(id);
    const unit = byId.get(id);
    if (!unit) return null;
    if (unit.unit_type === "wilayah") return unit;
    id = unit.parent_id;
  }
  return null;
}
export function filterPeople(rows: readonly PeopleViewModel[], filters: PeopleFilters) {
  const search = filters.search.trim().toLocaleLowerCase();
  return rows.filter(row => (!search || row.name.toLocaleLowerCase().includes(search) || (row.nip ?? "").toLocaleLowerCase().includes(search)) &&
    (!filters.jobTitle || row.jobTitle === filters.jobTitle) && (!filters.regionId || String(row.regionId) === filters.regionId) &&
    (!filters.outletId || String(row.outletId) === filters.outletId) && (!filters.source || row.source === filters.source) &&
    (!filters.status || row.active === (filters.status === "active")));
}
export function canEditPeopleIdentity(source: PeopleViewModel["source"]) { return source === "Manual"; }
export function acceptPeopleInquiry(state: PeopleInquiryState, requestId: number, result: PeopleInquiryResult | null): PeopleInquiryState {
  if (state.status !== "searching" || state.requestId !== requestId || (result && result.nip !== state.nip)) return state;
  if (!result) return { status: "not-found", nip: state.nip };
  return { status: result.duplicate ? "duplicate" : !result.matchedOutlet ? "mapping-failed" : !result.matchedOutlet.active ? "outlet-inactive" : "found", nip: state.nip, result };
}
