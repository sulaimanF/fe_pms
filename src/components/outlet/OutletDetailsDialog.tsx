"use client";

import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import { AccessDenied } from "@/components/auth/AccessGuard";
import { useOutlet } from "@/hooks/useOutlets";
import { isForbidden } from "@/lib/authorization";

export default function OutletDetailsDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const query = useOutlet(id);
  const status = axios.isAxiosError(query.error) ? query.error.response?.status : undefined;
  const denied = isForbidden(query.error) || (status !== undefined && status >= 400 && status < 500);
  const outlet = !denied ? query.data?.data : undefined;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle>Detail Outlet</DialogTitle><DialogDescription>Data master Outlet dari backend; bukan daftar assignment User.</DialogDescription></DialogHeader>
    {isForbidden(query.error) ? <AccessDenied /> : status === 401 ? <p role="alert">Sesi tidak berlaku.</p> : <>
      {!outlet && query.isLoading && <FormSkeleton />}
      {!!query.error && <p role="alert">{status === 404 ? "Outlet tidak tersedia." : outlet ? "Pembaruan detail gagal. Data terakhir ditampilkan." : "Detail gagal dimuat."} <Button disabled={query.isFetching} variant="outline" onClick={() => { void query.refetch(); }}>Coba lagi</Button></p>}
      {outlet && <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries({ Kode: outlet.code, Nama: outlet.name, Jenis: outlet.outlet_type, Organisasi: outlet.organization_unit?.name ?? `Organisasi #${outlet.organization_unit_id}`, Status: outlet.is_active ? "Active" : "Inactive",
          Alamat: outlet.address, Kota: outlet.city, Provinsi: outlet.province, Negara: outlet.country, "Kode pos": outlet.postal_code, Telepon: outlet.phone, Email: outlet.email,
          Latitude: outlet.latitude, Longitude: outlet.longitude, "Tanggal buka": outlet.opening_date, "Tanggal tutup": outlet.closing_date,
          Manager: outlet.manager?.full_name ?? (outlet.manager_user_id === null ? null : `User #${outlet.manager_user_id}`),
          "Jam operasional": outlet.operating_hours === null ? null : JSON.stringify(outlet.operating_hours), Metadata: outlet.metadata === null ? null : JSON.stringify(outlet.metadata),
        }).map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="break-words">{value ?? "—"}</dd></div>)}
      </dl>}
    </>}
  </DialogContent></Dialog>;
}
