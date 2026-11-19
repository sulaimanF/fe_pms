import api from "@/lib/axios";
import { isValidEntityId } from "@/lib/managementApi";
import { projectAuditLog, safeAuditText } from "@/lib/auditTrail";
import type { AuditDetailResponse, AuditListParams, AuditListResponse, AuditPagination } from "@/types/auditTrail";

// Verified routes only provide index, forResource and show. No export request exists.
export const AUDIT_EXPORT_AVAILABLE = false;

function object(value:unknown):Record<string,unknown> {
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Envelope Audit Trail tidak valid.");
  return value as Record<string,unknown>;
}
function envelope(value:unknown) {
  const body=object(value);
  if(body.success!==true||body.http_code!==200)throw new Error("Backend belum mengonfirmasi pembacaan Audit Trail.");
  return body;
}
export function validAuditParams(params:AuditListParams) {
  return isValidEntityId(params.page)&&Number.isSafeInteger(params.perPage)&&params.perPage>=1&&params.perPage<=100&&["asc","desc"].includes(params.sortDir);
}
function readPagination(value:unknown,params:AuditListParams):AuditPagination {
  const row=object(value);
  if(row.current_page!==params.page||row.per_page!==params.perPage||
    typeof row.total!=="number"||!Number.isSafeInteger(row.total)||row.total<0||!isValidEntityId(row.last_page)||
    (row.from!==null&&!isValidEntityId(row.from))||(row.to!==null&&!isValidEntityId(row.to)))throw new Error("Pagination Audit Trail tidak valid.");
  return {current_page:params.page,per_page:params.perPage,total:row.total,last_page:row.last_page,
    from:row.from as number|null,to:row.to as number|null};
}
export async function getAuditLogs(params:AuditListParams,signal?:AbortSignal):Promise<AuditListResponse> {
  if(!validAuditParams(params))throw new Error("Parameter halaman Audit Trail tidak valid.");
  const response=await api.get<unknown>("/audit-logs",{signal,params:{page:params.page,per_page:params.perPage,sort_dir:params.sortDir}});
  const body=envelope(response.data);
  if(!Array.isArray(body.data))throw new Error("Daftar Audit Trail tidak valid.");
  // Explicit projection prevents raw request/session/metadata/config objects from entering Query cache.
  return {success:true,http_code:200,request_id:null,message:typeof body.message==="string"?safeAuditText(body.message):"Audit logs retrieved",errors:null,meta:null,
    pagination:readPagination(body.pagination,params),data:body.data.map(projectAuditLog)};
}
export async function getAuditLog(id:number,signal?:AbortSignal):Promise<AuditDetailResponse> {
  if(!isValidEntityId(id))throw new Error("ID Audit Trail tidak valid.");
  const response=await api.get<unknown>("/audit-logs/"+id,{signal}),body=envelope(response.data),row=projectAuditLog(body.data);
  if(row.id!==id)throw new Error("Detail Audit Trail tidak sesuai ID.");
  return {success:true,http_code:200,request_id:null,message:typeof body.message==="string"?safeAuditText(body.message):"Audit log retrieved",errors:null,meta:null,pagination:null,data:row};
}

