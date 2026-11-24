"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import PeopleSelect from "./PeopleSelect";
import { AccessDenied } from "@/components/auth/AccessGuard";
import { usePeopleDetail } from "@/hooks/usePeople";
import { useSessionQuery } from "@/hooks/useAuth";
import { isForbidden } from "@/lib/authorization";
import { PEOPLE_API_AVAILABLE } from "@/services/people.services";
import UpdatePeopleForm from "./UpdatePeopleForm";

// Record loading boundary only; create and update workflow forms remain independent.
export default function PeopleRecordPage({ children }: { children?: (person: NonNullable<ReturnType<typeof usePeopleDetail>["data"]>) => React.ReactNode }) {
  const params = useParams<{ id: string }>(), session = useSessionQuery();
  const id = typeof params.id === "string" ? params.id : "";
  const query = usePeopleDetail(id);
  if (!PEOPLE_API_AVAILABLE) return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Update People</h1>
      <p className="text-sm text-muted-foreground">Data People belum dapat dimuat. Field dinonaktifkan sampai detail dari backend tersedia.</p>
      <Card className="rounded-2xl bg-white shadow-lg"><CardContent className="p-6">
        <fieldset disabled className="grid gap-4 md:grid-cols-2">
          {["Nama", "NIP"].map(label => <div key={label} className="space-y-1"><label htmlFor={`unavailable-${label}`} className="text-sm">{label}</label><Input id={`unavailable-${label}`} disabled /></div>)}
          {["Job Title", "Lokasi Outlet", "Kode Outlet", "Status"].map(label => <PeopleSelect key={label} id={`unavailable-${label.replaceAll(" ", "-")}`} label={label} value="" onChange={() => {}} options={[]} disabled />)}
        </fieldset>
      </CardContent></Card>
      <div className="flex justify-end gap-4"><Button asChild className="min-w-28 bg-gray-200 text-black hover:bg-gray-300"><Link href="/peopleManagement">Cancel</Link></Button><Button disabled className="min-w-28 bg-blue-600 text-white hover:bg-blue-700" title="API detail dan update People belum tersedia">Save</Button></div>
    </div>
  );
  if (isForbidden(query.error)) return <AccessDenied />;
  if (!query.data) return <div role="status">{query.error ? <><p>Detail belum dapat dimuat.</p><Button onClick={() => void query.refetch()}>Coba lagi</Button></> : "Memuat People..."}</div>;
  if (query.data.id !== id) return <p role="alert">Detail tidak sesuai People ID.</p>;
  return <div>{query.error && <div role="alert">Pembaruan data gagal; draft dipertahankan. <Button disabled={query.isFetching} onClick={() => void query.refetch()}>Coba lagi</Button></div>}<div key={`${session.id}:${id}`}>{children ? children(query.data) : <UpdatePeopleForm person={query.data} />}</div></div>;
}
