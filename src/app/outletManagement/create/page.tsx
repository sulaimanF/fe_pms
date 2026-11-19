"use client";

import CreateOutletForm from "@/components/outlet/CreateOutletForm";
import { AccessGuard } from "@/components/auth/AccessGuard";
import { ACCESS } from "@/lib/authorization";

export default function CreateOutletPage() {
  return (
    <AccessGuard permissions={ACCESS.outletCreate}>
      <CreateOutletForm />
    </AccessGuard>
  );
}
