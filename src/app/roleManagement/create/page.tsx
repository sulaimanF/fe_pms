"use client";
import CreateRoleForm from "@/components/role/CreateRoleForm";
import { AccessGuard } from "@/components/auth/AccessGuard";
import { ACCESS } from "@/lib/authorization";
export default function CreateRolePage() {
  return <AccessGuard permissions={ACCESS.roleCreate}><CreateRoleForm /></AccessGuard>;
}
