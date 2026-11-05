import { z } from "zod";
import type { MenuCatalogItem } from "@/types/menu";
import type { RoleSaveProgress } from "@/types/role";
const assignmentId = z.number().int().positive().refine(Number.isSafeInteger, "ID assignment tidak valid.");
export const roleSchema = z.object({
  code: z.string().trim().min(1, "Kode role wajib diisi.").max(50),
  name: z.string().trim().min(1, "Nama role wajib diisi.").max(100),
  description: z.string(),
  permission_ids: z.array(assignmentId),
  menu_ids: z.array(assignmentId),
});
export type RoleFormValues = z.infer<typeof roleSchema>;

// Transient, session-scoped snapshots survive a guard remount during /auth/me.
export interface RoleFormDraft {
  values: RoleFormValues;
  baseline?: RoleFormValues;
  progress?: RoleSaveProgress;
  issue?: string;
  unconfirmed?: boolean;
  complete?: boolean;
}

export function validateRoleMenuSelection(ids: number[], catalog: readonly MenuCatalogItem[], originalIds: readonly number[] = []): string | undefined {
  const selected = new Set(ids);
  const byId = new Map(catalog.map((menu) => [menu.id, menu]));
  for (const id of ids) {
    const menu = byId.get(id);
    // Preserve assignments that are absent/inactive in the visible catalog.
    if (!menu?.is_active) continue;
    if (menu.parent_id !== null) {
      const parent = byId.get(menu.parent_id);
      if (originalIds.includes(id) && !originalIds.includes(menu.parent_id)) continue;
      if (!parent?.is_active || parent.menu_type !== "group" || parent.parent_id !== null || !selected.has(parent.id)) {
        return `Menu "${menu.label}" memerlukan group induk aktif yang dipilih. Sidebar backend hanya menampilkan item top-level dan anak langsung group.`;
      }
    }
  }
}
