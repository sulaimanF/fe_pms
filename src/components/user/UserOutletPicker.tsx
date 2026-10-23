"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isForbidden } from "@/lib/authorization";

interface OutletOption { id: number; name: string; code?: string; outlet_type?: string }
interface Props {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  options: readonly OutletOption[];
  currentOutlets?: readonly Pick<OutletOption, "id" | "name">[];
  isLoading: boolean;
  error: unknown;
  disabled: boolean;
  onRetry: () => void;
}

// Selection and modal draft only; create/update submission remains in the separate forms.
export default function UserOutletPicker({ selectedIds, onChange, options, currentOutlets = [], isLoading, error, disabled, onRetry }: Props) {
  const [open, setOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<number[]>([]);
  const choices = new Map<number, OutletOption>(options.map((outlet) => [outlet.id, outlet]));
  for (const outlet of currentOutlets) if (!choices.has(outlet.id)) choices.set(outlet.id, outlet);
  for (const id of selectedIds) if (!choices.has(id)) choices.set(id, { id, name: "Outlet #" + id });
  const ready = !isLoading && !error;
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full justify-start" disabled={disabled}
        aria-label="Pilih Outlet Kelolaan" aria-haspopup="dialog" aria-expanded={open}
        onClick={() => { setDraftIds([...selectedIds]); setOpen(true); }}>
        <span className="truncate">{selectedIds.map((id) => choices.get(id)?.name ?? "Outlet #" + id).join(", ") || "Pilih outlet"}</span>
      </Button>
      {isLoading && <p role="status" className="text-sm">Memuat seluruh outlet...</p>}
      {!!error && <p role="alert" className="text-sm">{isForbidden(error) ? "Akses lookup outlet ditolak." : "Lookup outlet gagal dimuat."} <Button type="button" variant="outline" onClick={onRetry} disabled={disabled}>Coba lagi</Button></p>}
      <Dialog open={open} onOpenChange={(value) => {
        if (value && disabled) return;
        if (value) setDraftIds([...selectedIds]);
        setOpen(value);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Outlet Kelolaan</DialogTitle>
            <DialogDescription>Pilihan diterapkan ke form setelah Save. Penyimpanan database dilakukan melalui Save pada halaman User.</DialogDescription>
          </DialogHeader>
          {isLoading ? <p role="status">Memuat seluruh outlet...</p> :
            error ? <p role="alert">{isForbidden(error) ? "Akses lookup outlet ditolak." : "Lookup outlet gagal dimuat."} <Button type="button" variant="outline" onClick={onRetry}>Coba lagi</Button></p> :
            !choices.size ? <p role="status">Tidak ada outlet yang tersedia.</p> : (
              <div className="max-h-[50vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100"><tr><th className="w-10"><span className="sr-only">Pilih</span></th><th className="text-left">Nama Outlet</th><th className="text-left">Tipe Outlet</th></tr></thead>
                  <tbody>{[...choices.values()].map((outlet) => (
                    <tr key={outlet.id}>
                      <td><Checkbox aria-label={outlet.name} checked={draftIds.includes(outlet.id)} disabled={disabled || !ready}
                        onCheckedChange={(checked) => setDraftIds((current) => checked === true ? [...new Set([...current, outlet.id])] : current.filter((id) => id !== outlet.id))} /></td>
                      <td>{outlet.name}</td><td>{outlet.outlet_type ?? "-"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={disabled || !ready} onClick={() => { onChange([...draftIds]); setOpen(false); }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
