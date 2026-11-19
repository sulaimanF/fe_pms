import type { AuditJson, AuditLog, AuditValue } from "@/types/auditTrail";
import { isValidEntityId } from "@/lib/managementApi";

const privateKey = /password|passphrase|secret|token|authorization|api.?key|x.?code.?key|cookie|credential|otp|recovery.?code|session.?id|connection.?string/i;
const opaqueKey = /^(config|configuration|settings|headers|request|response|payload|metadata|relations|user|users|roles|permissions|menu|outlets|organization_unit|survey_module|questions)$|(?:^|_)(?:config|configuration)$/i;
export function safeAuditText(text:string) {
  return text.replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi,"Bearer [Disamarkan]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,"[Disamarkan]")
    .replace(/((?:password(?:_confirmation)?|secret|(?:access_|refresh_|remember_)?token|api[_-]?key|otp|authorization)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi,"$1[Disamarkan]")
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi,"$1[Disamarkan]@");
}
// Presentation defense only: response bytes still need BE sanitization.
// Keep a bounded, redacted snapshot, never cache the full audit model/config.
export function sanitizeAuditValue(value:unknown):AuditJson {
  let remaining=400;
  const visit=(item:unknown,depth:number):AuditJson=>{
    if(--remaining<0||depth>6)return "[Nilai lanjutan tidak ditampilkan]";
    if(item===null||typeof item==="boolean")return item;
    if(typeof item==="number")return Number.isFinite(item)?item:"[Angka tidak valid]";
    if(typeof item==="string"){
      const safe=safeAuditText(item);
      return safe.length>4096?safe.slice(0,4096)+"… [teks dibatasi]":safe;
    }
    if(Array.isArray(item)){
      const result=item.slice(0,50).map(child=>visit(child,depth+1));
      if(item.length>50)result.push("[Elemen berikutnya tidak ditampilkan]");
      return result;
    }
    if(item&&typeof item==="object"){
      const entries=Object.entries(item),visible=entries.slice(0,80).map(([key,child]):[string,AuditJson]=>[
        safeAuditText(key),privateKey.test(key)?"[Disamarkan]":opaqueKey.test(key)?"[Data konfigurasi/relasi tidak ditampilkan]":visit(child,depth+1),
      ]);
      if(entries.length>80)visible.push(["_display_limit","Field berikutnya tidak ditampilkan"]);
      return Object.fromEntries(visible);
    }
    return "[Tipe nilai tidak didukung]";
  };
  return visit(value,0);
}
function record(value:unknown):Record<string,unknown>|null {
  return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null;
}
const text=(value:unknown)=>typeof value==="string"&&value.trim()?safeAuditText(value.trim()):null;
export function projectAuditLog(value:unknown):AuditLog {
  const row=record(value);
  if(!row||!isValidEntityId(row.id)||typeof row.created_at!=="string"||typeof row.event_type!=="string"||
    (row.user_id!==null&&!isValidEntityId(row.user_id)))throw new Error("Respons Audit Trail tidak valid.");
  const user=record(row.user), userId=row.user_id as number|null;
  const author=text(user?.full_name)??text(user?.username)??(userId===null?"Sistem / tanpa pengguna":`User #${userId} (nama tidak tersedia)`);
  const metadata=record(row.metadata), notes=text(metadata?.notes), reason=text(metadata?.reason);
  const newData:AuditValue=Object.prototype.hasOwnProperty.call(row,"new_data")?{state:"present",value:sanitizeAuditValue(row.new_data)}:{state:"missing"};
  return {id:row.id,created_at:row.created_at,user_id:userId,author,event_type:safeAuditText(row.event_type),
    action:text(row.action),resource_type:text(row.resource_type),resource_id:text(row.resource_id),
    message:notes??reason,message_source:notes?"metadata.notes":reason?"metadata.reason":null,new_data:newData};
}
export function auditValueText(value:AuditValue) {
  return value.state==="missing"?"Field tidak tersedia":JSON.stringify(value.value,null,2);
}
export function auditChange(log:AuditLog) {
  return log.action&&log.action!==log.event_type?log.action+" · "+log.event_type:log.action??log.event_type;
}
export function auditResource(log:AuditLog) {
  return log.resource_type?(log.resource_type+(log.resource_id!==null?" #"+log.resource_id:"")):
    log.resource_id!==null?"ID "+log.resource_id:"—";
}
export function formatAuditTimestamp(value:string) {
  // serializeDate currently removes the timezone. Preserve this server clock:
  // interpreting a naive timestamp as browser local time would invent an offset.
  const naive=/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/.exec(value);
  if(naive){
    const check=new Date(naive[1]+"T"+naive[2]+"Z");
    if(Number.isFinite(check.getTime())&&check.toISOString().slice(0,19)===naive[1]+"T"+naive[2])return naive[1]+" "+naive[2];
    return "Timestamp tidak valid";
  }
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return "Timestamp tidak valid";
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()))return "Timestamp tidak valid";
  return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).format(date)+" WIB";
}

