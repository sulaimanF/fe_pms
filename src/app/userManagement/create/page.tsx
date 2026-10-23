"use client";
import CreateUserForm from "@/components/user/CreateUserForm";
import { AccessGuard } from "@/components/auth/AccessGuard";
import { ACCESS } from "@/lib/authorization";
export default function CreateUserPage() {
  return <AccessGuard permissions={ACCESS.userCreate}><CreateUserForm /></AccessGuard>;
}
