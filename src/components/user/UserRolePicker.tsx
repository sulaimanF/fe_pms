"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Role } from "@/types/role";

interface Props {
  options: readonly Pick<Role, "id" | "name" | "code">[];
  selectedIds: readonly number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}

export default function UserRolePicker({ options, selectedIds, onChange, disabled, invalid }: Props) {
  const selectedRole = selectedIds.length === 1 ? options.find((role) => role.id === selectedIds[0]) : undefined;
  const label = selectedRole?.name ?? (selectedIds.length ? `${selectedIds.length} role dipilih` : "Pilih role");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="user-roles" type="button" variant="outline" disabled={disabled} aria-invalid={invalid}
          className="w-full min-w-0 justify-between font-normal">
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[min(16rem,var(--radix-dropdown-menu-content-available-height))]">
        {options.map((role) => (
          <DropdownMenuCheckboxItem key={role.id} checked={selectedIds.includes(role.id)} disabled={disabled}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => {
              if (disabled) return;
              onChange(checked === true ? [...new Set([...selectedIds, role.id])] : selectedIds.filter((id) => id !== role.id));
            }}>
            {role.name} ({role.code})
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
