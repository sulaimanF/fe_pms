"use client";

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Props {
  notice: string;
  pending: boolean;
  onCheck: () => void;
  onRelease: () => void;
}

// Presentation only: each form keeps its own draft, payload, and submit workflow.
export default function UserWriteRecoveryNotice({ notice, pending, onCheck, onRelease }: Props) {
  return <div className="space-y-3 rounded-lg border p-4">
    <p role="alert">{notice}</p>
    <p className="text-sm">Save diblokir untuk mencegah pengiriman ulang. Pemeriksaan memakai snapshot percobaan sebelumnya, bukan isian yang diubah setelahnya. Snapshot hanya tersedia selama halaman ini terbuka.</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={onCheck}>{pending ? "Memeriksa..." : "Periksa hasil"}</Button>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={pending}>Mulai percobaan baru...</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hasil sebelumnya masih belum pasti</AlertDialogTitle>
            <AlertDialogDescription>Penyimpanan sebelumnya mungkin masih diproses atau sudah tersimpan. Periksa secara terpisah dengan administrator sebelum melanjutkan. Percobaan create baru berisiko membuat User tambahan, termasuk jika identifier diganti. Penyimpanan update baru dapat menimpa data atau mengubah password lagi. Melanjutkan hanya membuka Save, tanpa mengirim request. Password akan dikosongkan agar tidak terkirim ulang tanpa diisi kembali.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={onRelease}>Saya memahami risiko, buka Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>;
}
