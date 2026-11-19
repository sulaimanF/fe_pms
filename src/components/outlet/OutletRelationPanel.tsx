"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export interface OutletRelationOption {
    id: number;
    name: string;
    city?: string | null;
    parentLabel?: string;
}
interface Props {
    title: string;
    rows: OutletRelationOption[];
    options: OutletRelationOption[];
    onChange?: (ids: number[]) => void;
    single?: boolean;
    disabled?: boolean;
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
    reason?: string;
    canRemove?: (id: number) => boolean;
    consequence?: string;
}
export default function OutletRelationPanel({ title, rows, options, onChange, single, disabled, loading, error, onRetry, reason, canRemove = () => true, consequence }: Props) {
    const [operation, setOperation] = useState<"link" | "unlink" | null>(null);
    const [selection, setSelection] = useState<number[]>([]);
    const readonly = !onChange || disabled || loading || error;
    const candidates = operation === "unlink" ? rows : [...new Map([...rows, ...options].map(row => [row.id, row])).values()];
    const open = (next: "link" | "unlink") => { setSelection(next === "link" ? rows.map(row => row.id) : []); setOperation(next); };
    const apply = () => {
        if (readonly || !onChange)
            return;
        const allowed = new Set(candidates.filter(row => operation !== "unlink" || canRemove(row.id)).map(row => row.id));
        const ids = [...new Set(selection.filter(id => allowed.has(id)))];
        if (single && operation === "link" && ids.length > 1)
            return;
        onChange(operation === "unlink" ? rows.filter(row => !ids.includes(row.id)).map(row => row.id) : ids);
        setOperation(null);
    };
    return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="flex gap-3">
        <Button type="button" className="min-w-20 bg-blue-600 text-white hover:bg-blue-700" disabled={!!readonly} onClick={() => open("link")}>Link</Button>
        <Button type="button" className="min-w-20 bg-red-600 text-white hover:bg-red-700" disabled={!!readonly || !rows.some(row => canRemove(row.id))} onClick={() => open("unlink")}>Unlink</Button>
      </div>
    </div>
    <Card className="min-h-52 rounded-2xl bg-white py-0 shadow-lg">
      <Table><TableHeader><TableRow><TableHead className="px-5">Nama</TableHead><TableHead className="px-5">Kota</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map(row => <TableRow key={row.id}><TableCell className="px-5 py-3">{row.name}</TableCell><TableCell className="px-5 py-3">{row.city || "—"}</TableCell></TableRow>)}
          {!rows.length && <TableRow><TableCell colSpan={2} className="px-5 py-5 text-muted-foreground">{loading ? "Memuat relasi..." : error ? "Relasi belum dapat dimuat." : "Belum ada hubungan."}</TableCell></TableRow>}
        </TableBody></Table>
    </Card>
      {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      {error && <p role="alert" className="text-xs text-red-600">Lookup hubungan gagal atau akses ditolak. Pilihan tidak dapat diubah sampai lookup tersedia.</p>}
    {error && onRetry && <Button type="button" variant="outline" onClick={onRetry}>Coba lagi lookup</Button>}
    <Dialog open={operation !== null} onOpenChange={value => { if (!value)
        setOperation(null); }}><DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>{operation === "unlink" ? "Unlink" : "Link"} {title}</DialogTitle><DialogDescription>{consequence ?? "Pilihan hanya mengubah draft. Hubungan disimpan setelah Save; Cancel tidak mengirim perubahan."}</DialogDescription></DialogHeader>
      <div className="max-h-80 space-y-3 overflow-y-auto">
        {candidates.map(row => {
            const locked = !canRemove(row.id) && (operation === "unlink" || (!single && rows.some(current => current.id === row.id)));
            return <label key={row.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
            <input type={single && operation === "link" ? "radio" : "checkbox"} name="outlet-relation-choice" checked={selection.includes(row.id)} disabled={!!readonly || locked} onChange={event => setSelection(current => single && operation === "link" ? [row.id] : event.target.checked ? [...new Set([...current, row.id])] : current.filter(id => id !== row.id))}/>
            <span><span className="font-medium">{row.name}</span><span className="block text-muted-foreground">{row.city || "Kota belum tersedia"}{row.parentLabel ? ` · Induk saat ini: ${row.parentLabel}` : ""}{locked ? " · Induk wajib, tidak dapat dilepas" : ""}</span></span>
          </label>;
        })}
        {!candidates.length && <p>Tidak ada pilihan tersedia.</p>}
      </div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOperation(null)}>Cancel</Button><Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" disabled={!!readonly || !selection.length} onClick={apply}>Terapkan ke draft</Button></DialogFooter>
    </DialogContent></Dialog>
  </section>;
}
