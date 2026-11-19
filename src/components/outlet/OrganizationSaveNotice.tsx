"use client";
import { Button } from "@/components/ui/button";
import type { OrganizationSaveAttempt } from "@/types/organizationUnit";
export default function OrganizationSaveNotice({ attempt, pending, onRetry, onCheck }: {
    attempt: OrganizationSaveAttempt;
    pending: boolean;
    onRetry: () => void;
    onCheck: () => void;
}) {
    return <div role="alert" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
    <p>{attempt.issue}</p>
      {attempt.primaryConfirmed && <p>Organisasi #{attempt.id} sudah tersimpan. {attempt.remaining.length} tahap hubungan belum selesai. Penyimpanan ini menggunakan beberapa request dan tidak atomik. Cancel hanya meninggalkan halaman; data yang terkonfirmasi tidak dibatalkan.</p>}
    {attempt.uncertain ? <><p>Hasil request terakhir belum pasti. Tidak ada request yang diulang otomatis. Periksa bersama administrator sebelum mencoba perubahan baru.</p><Button type="button" variant="outline" disabled={pending} onClick={onCheck}>{pending ? "Memeriksa..." : "Periksa hasil"}</Button></> :
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" disabled={pending} onClick={onRetry}>Retry relasi yang belum selesai</Button>}
  </div>;
}
