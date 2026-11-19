import type { Outlet } from "@/types/outlet";
import type { OrganizationUnit } from "@/types/organizationUnit";

type OrganizationSource =
  | readonly OrganizationUnit[]
  | ReadonlyMap<number, OrganizationUnit>;
export function outletHierarchy(
  organizationId: number,
  organizations: OrganizationSource,
) {
  const byId =
    "get" in organizations
      ? organizations
      : new Map(
          organizations.map((organization) => [organization.id, organization]),
        );
  const visited = new Set<number>();
  let current = byId.get(organizationId);
  let kc: string | undefined, wilayah: string | undefined;
  while (current) {
    if (visited.has(current.id))
      return {
        kc: "Tidak dapat ditentukan",
        wilayah: "Tidak dapat ditentukan",
      };
    visited.add(current.id);
    if (!kc && current.unit_type === "cabang") kc = current.name;
    if (!wilayah && current.unit_type === "wilayah") wilayah = current.name;
    current =
      current.parent_id === null ? undefined : byId.get(current.parent_id);
  }
  return {
    kc: kc ?? "Tidak dapat ditentukan",
    wilayah: wilayah ?? "Tidak dapat ditentukan",
  };
}

export type OutletTableRow = Outlet & { kantorWilayah: string; kc: string };
export function mapOutletRow(
  outlet: Outlet,
  organizations: OrganizationSource,
): OutletTableRow {
  const hierarchy = outletHierarchy(outlet.organization_unit_id, organizations);
  return { ...outlet, kantorWilayah: hierarchy.wilayah, kc: hierarchy.kc };
}
