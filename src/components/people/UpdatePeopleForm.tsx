"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PeopleFields from "./PeopleFields";
import { canEditPeopleIdentity } from "@/lib/people";
import { usePeopleAccess } from "@/hooks/usePeople";
import { PEOPLE_UNAVAILABLE } from "@/services/people.services";
import { updatePeopleSchema } from "@/validations/peopleSchema";
import type { PeopleFormValues } from "@/validations/peopleSchema";
import type { PeopleViewModel } from "@/types/people";

export default function UpdatePeopleForm({ person }: { person: PeopleViewModel }) {
  // Baseline is fixed for this mounted entity. Background refetch never resets a draft.
  const [baseline] = useState(person);
  const access = usePeopleAccess();
  const form = useForm<PeopleFormValues>({ resolver: zodResolver(updatePeopleSchema), defaultValues: { name: baseline.name, nip: baseline.nip ?? "", position: baseline.position ?? "", jobTitle: baseline.jobTitle, outletId: String(baseline.outletId), status: baseline.active ? "active" : "inactive" } });
  const submit = form.handleSubmit(() => { if (access.allowed) form.setError("root", { message: PEOPLE_UNAVAILABLE }); });
  return <div className="space-y-5"><h1 className="text-2xl font-semibold">Update People</h1><p>Source: {baseline.source} · People ID: {baseline.id}</p>
    <form onSubmit={submit}><Card className="rounded-2xl bg-white shadow-lg"><CardContent className="space-y-6 p-6"><PeopleFields form={form} identityEditable={canEditPeopleIdentity(baseline.source)} existingOutlet={{ id: baseline.outletId, name: baseline.outletName, code: baseline.outletCode }} /><p role="alert">{form.formState.errors.root?.message}</p></CardContent></Card>
      <div className="mt-6 flex justify-end gap-4"><Button asChild className="min-w-28 bg-gray-200 text-black hover:bg-gray-300"><Link href="/peopleManagement">Cancel</Link></Button><Button type="submit" className="min-w-28 bg-blue-600 text-white hover:bg-blue-700" disabled title="Kontrak update berdasarkan source belum tersedia">Save</Button></div>
    </form></div>;
}
