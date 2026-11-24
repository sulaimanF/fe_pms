"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createManualPeopleSchema } from "@/validations/peopleSchema";
import type { PeopleFormValues } from "@/validations/peopleSchema";
import PeopleFields from "./PeopleFields";
import { PEOPLE_UNAVAILABLE } from "@/services/people.services";
import { usePeopleAccess } from "@/hooks/usePeople";

export default function CreateManualPeopleForm() {
  const access = usePeopleAccess();
  const form = useForm<PeopleFormValues>({ resolver: zodResolver(createManualPeopleSchema), defaultValues: { name: "", nip: "", position: "", outletId: "", status: "active" } });
  const submit = form.handleSubmit(() => {
    if (!access.allowed) return;
    form.setError("root", { message: PEOPLE_UNAVAILABLE });
  });
  return <div className="space-y-5"><h1 className="text-2xl font-semibold">Add People Manually</h1><p className="text-sm">Source: Manual. Status pada draft dapat dipilih sebelum API tersedia.</p>
    <form onSubmit={submit}><Card className="rounded-2xl bg-white shadow-lg"><CardContent className="space-y-6 p-6"><PeopleFields form={form} identityEditable /><p role="alert">{form.formState.errors.root?.message}</p></CardContent></Card>
      <div className="mt-6 flex justify-end gap-4"><Button asChild className="min-w-28 bg-gray-200 text-black hover:bg-gray-300"><Link href="/peopleManagement">Cancel</Link></Button><Button type="submit" className="min-w-28 bg-blue-600 text-white hover:bg-blue-700" disabled title="API dan master Job Title belum tersedia">Save</Button></div>
    </form></div>;
}
