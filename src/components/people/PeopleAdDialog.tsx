"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PeopleSelect from "./PeopleSelect";
import { PEOPLE_JOB_TITLES } from "@/types/people";
import type { PeopleInquiryState } from "@/types/people";

export const INQUIRY_MESSAGES: Record<PeopleInquiryState["status"], string> = {
  idle: "Masukkan NIP untuk inquiry melalui backend.", searching: "Mencari personel di AD...", found: "Personel ditemukan dan Outlet aktif berhasil dipetakan.",
  "not-found": "NIP tidak ditemukan di AD.", duplicate: "NIP sudah terdaftar. Penambahan diblokir.", "mapping-failed": "Kode Outlet AD belum cocok dengan master Outlet PMS.",
  "outlet-inactive": "Outlet hasil mapping inactive. Penambahan diblokir.", failed: "Layanan AD gagal. Hasil belum dapat digunakan.", unavailable: "Inquiry AD belum tersedia di backend. Tidak ada pencarian atau penyimpanan yang dikirim.",
};
export default function PeopleAdDialog({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<PeopleInquiryState>({ status: "idle", nip: "" });
  const [jobTitle, setJobTitle] = useState("");
  const result = "result" in state ? state.result : null;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Add from User AD</DialogTitle><DialogDescription>Inquiry personel berdasarkan NIP, tanpa membuat akun login PMS. API AD dan status awal People AD belum ditentukan.</DialogDescription></DialogHeader>
    <label htmlFor="people-ad-nip">NIP</label><Input id="people-ad-nip" value={state.nip} readOnly={!!result} onChange={event => { setState({ status: "idle", nip: event.target.value }); setJobTitle(""); }} />
    <div className="flex gap-2"><Button className="bg-blue-600 text-white hover:bg-blue-700" disabled title="Endpoint AD belum tersedia">Search AD (belum tersedia)</Button>{result && <Button variant="outline" onClick={() => { setState({ status: "idle", nip: "" }); setJobTitle(""); }}>Ganti NIP</Button>}</div>
    <p role="status">{state.status === "idle" ? `${INQUIRY_MESSAGES.idle} ${INQUIRY_MESSAGES.unavailable}` : INQUIRY_MESSAGES[state.status]}</p>
    {result && <div className="space-y-3">{[["Nama", result.name], ["Jabatan organisasi", result.position ?? "—"], ["Penempatan AD", result.placement], ["Kode Outlet AD", result.outletCode], ["Mapping Outlet PMS", result.matchedOutlet?.name ?? "Belum cocok"]].map(([label, value]) => <div key={label}><p className="text-sm">{label}</p><Input readOnly aria-label={label} value={value} /></div>)}</div>}
    <PeopleSelect id="people-ad-job" label="Job Title PMS" value={jobTitle} onChange={setJobTitle} disabled={!result || state.status !== "found"} options={PEOPLE_JOB_TITLES.map(value => ({ value, label: value }))} />
    <div className="flex justify-end gap-4"><Button className="min-w-28 bg-gray-200 text-black hover:bg-gray-300" onClick={onClose}>Cancel</Button><Button className="min-w-28 bg-blue-600 text-white hover:bg-blue-700" disabled title="API penyimpanan dan master Job Title belum tersedia">Save</Button></div>
  </DialogContent></Dialog>;
}
