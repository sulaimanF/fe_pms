"use client";
export default function AuditTextCell({value,label,onExpand,mono=false}:{value:string;label:string;onExpand:()=>void;mono?:boolean}) {
  return <button type="button" className={"block w-full max-w-[280px] rounded-sm text-left focus-visible:outline-2 focus-visible:outline-blue-600 "+(mono?"font-mono text-xs":"")} aria-label={"Baca "+label+" lengkap"} title="Baca nilai lengkap" onClick={onExpand}>
    <span className="block truncate">{value}</span>
  </button>;
}

