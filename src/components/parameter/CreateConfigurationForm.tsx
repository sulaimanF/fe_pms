"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ParameterFields from "./ParameterFields";
import { configurationFields } from "./parameterFieldDefinitions";
import { ParameterWriteNotice, parameterRequestErrors, parameterValidationErrors } from "./ParameterFeedback";
import type { ParameterAttempt } from "./ParameterFeedback";
import { useCreateParameter } from "@/hooks/useParameterPenilaian";
import { assertParameterAccess, canManageParameters } from "@/lib/parameterAuthorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { checkParameterResult, parameterLink, parameterRoot } from "@/lib/parameterPenilaian";
import { ParameterUncertainError } from "@/services/parameterPenilaian.services";
import { createConfigurationSchema, emptyConfiguration, buildConfiguration } from "@/validations/parameterPenilaianSchema";
import type { ConfigurationValues } from "@/validations/parameterPenilaianSchema";
import type { ParameterSection, AssessmentPeriod } from "@/types/parameterPenilaian";

export default function CreateConfigurationForm({ section, periods, initialPeriodId }: { section:ParameterSection; periods:AssessmentPeriod[]; initialPeriodId?:number }) {
  const router=useRouter();
  const mutation=useCreateParameter("configurations",section.id);
  const [values,setValues]=useState<ConfigurationValues>(()=>({...emptyConfiguration,assessment_period_id:initialPeriodId?String(initialPeriodId):""}));
  
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [attempt,setAttempt]=useState<ParameterAttempt>();
  const [checking,setChecking]=useState(false), [saved,setSaved]=useState(false);
  const running=useRef(false), mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const pending=mutation.isPending||checking;
  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(running.current||pending||attempt||saved)return;
    running.current=true;
    const context=captureSession();
    try {
      assertParameterAccess(context.id);
      const parsed=createConfigurationSchema.safeParse(values);
      if(!parsed.success){setErrors(parameterValidationErrors(parsed.error));return;}
      if(!periods.some(item=>item.id===Number(parsed.data.assessment_period_id))){setErrors({assessment_period_id:"Periode tidak tersedia."});return;}
      
      const payload=buildConfiguration(parsed.data);
      
      const snapshot=structuredClone(payload);
      setErrors({});
      try {
        const result=await mutation.mutateAsync(payload);
        if(!mounted.current||!isCurrentSession(context)||!canManageParameters())return;
        setSaved(true);
        const message=typeof result.response.message==="string"&&result.response.message.trim()?result.response.message.trim().slice(0,500):"Data berhasil disimpan.";
        if(result.synchronizationFailed)toast.warning(message+" Penyimpanan terkonfirmasi, tetapi sinkronisasi tampilan gagal. Jangan ulangi Save.");
        else toast.success(message);
        router.push(parameterLink(parameterRoot+"/sections/"+section.id,section.survey_module_id,payload.assessment_period_id));
      } catch(error:unknown) {
        if(!mounted.current||!isCurrentSession(context))return;
        if(error instanceof ParameterUncertainError)setAttempt({payload:snapshot,id:error.entityId,filters:{parentId:section.id},message:error.message});
        else setErrors(parameterRequestErrors(error));
      }
    } catch(error:unknown){if(mounted.current&&isCurrentSession(context))setErrors(parameterRequestErrors(error));}
    finally{running.current=false;}
  };
  const check=async()=>{
    if(!attempt||running.current)return;
    running.current=true;setChecking(true);
    const context=captureSession(), snapshot=attempt;
    try{
      const message=await checkParameterResult("configurations",snapshot.payload,snapshot.filters,snapshot.id);
      if(mounted.current&&isCurrentSession(context))setAttempt({...snapshot,message});
    }catch{if(mounted.current&&isCurrentSession(context))setAttempt({...snapshot,message:"Pemeriksaan gagal/ditolak. Ini bukan bukti penyimpanan sebelumnya gagal."});}
    finally{running.current=false;if(mounted.current&&isCurrentSession(context))setChecking(false);}
  };
  return <form onSubmit={submit} className="max-w-3xl space-y-6" aria-busy={pending}>
    <h1 className="text-2xl font-bold">Create Configuration</h1>
    <p className="text-sm text-muted-foreground">Konfigurasi ini disimpan terpisah dari section. Backend tidak mewajibkan total bobot 100% atau mengunci periode closed. Perubahan konfigurasi dapat memengaruhi perhitungan berikutnya; hasil tersimpan tidak otomatis dihitung ulang.</p>
    
    {errors.root&&<p role="alert">{errors.root}</p>}
    {attempt&&<ParameterWriteNotice attempt={attempt} pending={pending} onCheck={()=>{void check();}} onRelease={()=>{if(!running.current)setAttempt(undefined);}}/>}
    <ParameterFields values={values} fields={configurationFields.map(field=>field.name==="assessment_period_id"?{...field,kind:"select" as const,readOnly:false,options:periods.map(item=>({value:String(item.id),label:item.year+" Q"+item.quarter+" — "+item.status}))}:field)} errors={errors} disabled={pending||saved} onChange={(name,value)=>setValues(previous=>({...previous,[name]:value}))}/>
    <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={pending} onClick={()=>router.back()}>Batal</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending||!!attempt||saved}>{pending?"Memproses...":"Save"}</Button></div>
  </form>;
}

