"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PeopleViewModel } from "@/types/people";
export default function PeopleStatusDialog({ person, onClose }: { person: PeopleViewModel; onClose: () => void }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{person.active ? "Nonaktifkan" : "Aktifkan"} People?</DialogTitle><DialogDescription>People ID: {person.id}. People inactive tidak dipilih untuk penilaian baru. Histori penilaian tetap dipertahankan; akun User PMS tidak diubah.</DialogDescription></DialogHeader><p>API perubahan status belum tersedia. Tidak ada perubahan yang dikirim.</p><div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled>Konfirmasi (belum tersedia)</Button></div></DialogContent></Dialog>;
}
