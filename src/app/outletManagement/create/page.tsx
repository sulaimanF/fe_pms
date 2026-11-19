"use client";

import CreateOutletForm from "@/components/outlet/CreateOutletForm";
import { AccessGuard } from "@/components/auth/AccessGuard";
import { ACCESS } from "@/lib/authorization";
import { canAccess } from "@/lib/authorization";
import { useState } from "react";
import { useSessionQuery } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateOrganizationForm from "@/components/outlet/CreateOrganizationForm";

export default function CreateOutletPage() {
  return (
    <AccessGuard>
      <CreateEntry />
    </AccessGuard>
  );
}

function CreateEntry(){
  const session=useSessionQuery();
  return <CreateSelection key={session.id}/>;
}
function CreateSelection(){
  const session=useSessionQuery();
  const [kind,setKind]=useState<"wilayah"|"cabang"|"outlet">(()=>canAccess(ACCESS.outletCreate)?"outlet":"wilayah");
  const renderKindPicker=(disabled:boolean)=><div><label htmlFor="create-outlet-kind" className="mb-1 block text-sm">Jenis</label><Select value={kind} disabled={disabled} onValueChange={value=>{
    if((value==="wilayah"||value==="cabang")&&canAccess(ACCESS.organizationCreate))setKind(value);
    if(value==="outlet"&&canAccess(ACCESS.outletCreate))setKind(value);
  }}><SelectTrigger id="create-outlet-kind" className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="wilayah" disabled={!canAccess(ACCESS.organizationCreate)}>Kantor Wilayah</SelectItem><SelectItem value="cabang" disabled={!canAccess(ACCESS.organizationCreate)}>Kantor Cabang</SelectItem><SelectItem value="outlet" disabled={!canAccess(ACCESS.outletCreate)}>Kantor Cabang Pembantu (Outlet)</SelectItem></SelectContent></Select></div>;
  return <div className="space-y-6 rounded-xl bg-gray-50 p-3 sm:p-6"><h1 className="text-2xl font-bold">Create Data Outlet</h1><AccessGuard permissions={kind==="outlet"?ACCESS.outletCreate:ACCESS.organizationCreate}>{kind==="outlet"?<CreateOutletForm key={`${session.id}:outlet`} renderKindPicker={renderKindPicker}/>:<CreateOrganizationForm key={`${session.id}:${kind}`} type={kind} renderKindPicker={renderKindPicker}/>}</AccessGuard></div>;
}
