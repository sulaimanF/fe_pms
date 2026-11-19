"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OutletWriteNotice({
  message,
  pending,
  onCheck,
  onRelease,
}: {
  message: string;
  pending: boolean;
  onCheck: () => void;
  onRelease: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p role="alert">{message}</p>
      <p className="text-sm">
        Save diblokir. Pemeriksaan memakai snapshot percobaan di memori halaman
        perubahan draft tidak mengganti snapshot.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCheck}
        >
          {pending ? "Memeriksa..." : "Periksa hasil"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Percobaan baru...
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hasil sebelumnya belum pasti</AlertDialogTitle>
              <AlertDialogDescription>
                Periksa hasil bersama administrator sebelum melanjutkan. Request
                sebelumnya mungkin masih diproses atau sudah tersimpan.
                Menyimpan lagi dapat membuat Outlet tambahan jika kode diganti,
                atau menimpa perubahan. Melanjutkan hanya membuka Save, tanpa
                mengulang request.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction disabled={pending} onClick={onRelease}>
                Saya memahami risiko, buka Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
