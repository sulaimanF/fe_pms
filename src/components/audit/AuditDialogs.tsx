"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import { ACCESS, isForbidden } from "@/lib/authorization";
import { auditChange, auditResource, auditValueText, formatAuditTimestamp } from "@/lib/auditTrail";
import { useAuditLog } from "@/hooks/useAuditTrail";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import axios from "axios";

export interface AuditExpandedValue { label:string; text:string }
export function AuditValueDialog({value,onClose}:{value:AuditExpandedValue;onClose:()=>void}) {
  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle>{value.label}</DialogTitle><DialogDescription>Nilai dari halaman audit yang sedang ditampilkan. Field sensitif/konfigurasi dapat disamarkan dan nilai sangat besar dibatasi.</DialogDescription></DialogHeader>
    <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-sm">{value.text}</pre>
  </DialogContent></Dialog>;
}
export function AuditDetailsDialog({id,onClose}:{id:number;onClose:()=>void}) {
  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle>Detail Audit Trail</DialogTitle><DialogDescription>Detail log dimuat ulang melalui endpoint yang memerlukan audit.view.</DialogDescription></DialogHeader>
    <AccessGuard permissions={ACCESS.auditDetail}><AuditDetailContent id={id}/></AccessGuard>
  </DialogContent></Dialog>;
}
function AuditDetailContent({id}:{id:number}) {
  const query=useAuditLog(id),status=axios.isAxiosError(query.error)?query.error.response?.status:undefined;
  if(isForbidden(query.error))return <AccessDenied/>;
  if(status===401)return <p role="alert">Sesi tidak berlaku.</p>;
  const rejected=status!==undefined&&status>=400&&status<500;
  if(query.error&&(!query.data||rejected))return <p role="alert">{status===404?"Log tidak tersedia.":"Detail gagal dimuat."} <Button variant="outline" disabled={query.isFetching} onClick={()=>{void query.refetch();}}>Coba lagi</Button></p>;
  if(!query.data)return <FormSkeleton/>;
  const row=query.data.data;
  const values=[["Timestamp",formatAuditTimestamp(row.created_at)],["Author",row.author],["Change",auditChange(row)],["Resource",auditResource(row)],["Message"+(row.message_source?" ("+row.message_source+")":""),row.message??"—"],["New value",auditValueText(row.new_data)]];
  return <div className="space-y-4">
    {!!query.error&&<p role="alert">Pembaruan detail gagal. Data terakhir ditampilkan. <Button variant="outline" disabled={query.isFetching} onClick={()=>{void query.refetch();}}>Coba lagi</Button></p>}
    <dl className="space-y-4">{values.map(([label,value])=><div key={label}><dt className="font-medium">{label}</dt><dd className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2 text-sm">{value}</dd></div>)}</dl>
  </div>;
}

