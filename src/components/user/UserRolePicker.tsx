"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role } from "@/types/role";

interface Props {
  options: readonly Pick<Role, "id" | "name" | "code">[];
  currentRoles?: readonly Pick<Role, "id" | "name" | "code">[];
  selectedIds: readonly number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}

export default function UserRolePicker({ options, currentRoles = [], selectedIds, onChange, disabled, invalid }: Props) {
  const hasMultipleRoles = selectedIds.length > 1;
  const currentRole = selectedIds.length === 1 ? currentRoles.find((role) => role.id === selectedIds[0]) : undefined;
  const missingCurrentRole = currentRole && !options.some((role) => role.id === currentRole.id) ? currentRole : undefined;
  const value = hasMultipleRoles ? "" : selectedIds.length === 1 ? String(selectedIds[0]) : "none";

  return (
    <div className="space-y-2">
      <Select disabled={disabled} value={value} onValueChange={(nextValue) => {
        if (disabled) return;
        if (nextValue === "none") { onChange([]); return; }
        const role = options.find((item) => String(item.id) === nextValue);
        if (role) onChange([role.id]);
      }}>
        <SelectTrigger id="user-roles" className="w-full" aria-invalid={invalid || hasMultipleRoles}
          aria-describedby={hasMultipleRoles ? "user-roles-legacy" : undefined}>
          <SelectValue placeholder="Pilih satu role" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="none">Tanpa role</SelectItem>
          {missingCurrentRole && <SelectItem value={String(missingCurrentRole.id)} disabled>{missingCurrentRole.name} (role saat ini)</SelectItem>}
          {options.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.name} ({role.code})</SelectItem>)}
        </SelectContent>
      </Select>
      {hasMultipleRoles && <p id="user-roles-legacy" role="alert" className="text-sm text-red-600">
        User ini memiliki beberapa role lama. Pilih satu role sebelum menyimpan; pilihan tersebut akan mengganti assignment role lama.
      </p>}
    </div>
  );
}
