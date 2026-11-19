"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ParameterFields from "./ParameterFields";
import { optionFields } from "./parameterFieldDefinitions";
import { ParameterWriteNotice, parameterRequestErrors, parameterValidationErrors } from "./ParameterFeedback";
import type { ParameterAttempt } from "./ParameterFeedback";
import { useUpdateParameter } from "@/hooks/useParameterPenilaian";
import { assertParameterAccess, canManageParameters } from "@/lib/parameterAuthorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { checkParameterResult, parameterLink, parameterRoot } from "@/lib/parameterPenilaian";
import { ParameterUncertainError } from "@/services/parameterPenilaian.services";
import { updateOptionSchema, optionValues, parameterChanges, buildOption } from "@/validations/parameterPenilaianSchema";
import type { OptionValues } from "@/validations/parameterPenilaianSchema";
import type { ParameterOption, ParameterQuestion } from "@/types/parameterPenilaian";

export default function UpdateOptionForm({ option, question, periodId }: { option:ParameterOption; question:ParameterQuestion; periodId?:number }) {
  const router=useRouter();
  const mutation=useUpdateParameter("options" ,option.id);
  const [values,setValues]=useState<OptionValues>(()=>(optionValues(option)));
  const baseline=useRef(optionValues(option));
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
      const parsed=updateOptionSchema.safeParse(values);
      if(!parsed.success){setErrors(parameterValidationErrors(parsed.error));return;}
      
      const payload=parameterChanges(buildOption(parsed.data),buildOption(baseline.current));
      if(!Object.keys(payload).length){setErrors({root:"Tidak ada perubahan untuk disimpan."});return;}
      const snapshot=structuredClone(payload);
      setErrors({});
      try {
        const result=await mutation.mutateAsync(payload);
        if(!mounted.current||!isCurrentSession(context)||!canManageParameters())return;
        setSaved(true);
        const message=typeof result.response.message==="string"&&result.response.message.trim()?result.response.message.trim().slice(0,500):"Data berhasil disimpan.";
        if(result.synchronizationFailed)toast.warning(message+" Penyimpanan terkonfirmasi, tetapi sinkronisasi tampilan gagal. Jangan ulangi Save.");
        else toast.success(message);
        router.push(parameterLink(parameterRoot+"/questions/"+question.id,question.survey_module_id,periodId));
      } catch(error:unknown) {
        if(!mounted.current||!isCurrentSession(context))return;
        if(error instanceof ParameterUncertainError)setAttempt({payload:snapshot,id:option.id,filters:{parentId:option.question_id},message:error.message});
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
      const message=await checkParameterResult("options",snapshot.payload,snapshot.filters,snapshot.id);
      if(mounted.current&&isCurrentSession(context))setAttempt({...snapshot,message});
    }catch{if(mounted.current&&isCurrentSession(context))setAttempt({...snapshot,message:"Pemeriksaan gagal/ditolak. Ini bukan bukti penyimpanan sebelumnya gagal."});}
    finally{running.current=false;if(mounted.current&&isCurrentSession(context))setChecking(false);}
  };
  return <form onSubmit={submit} className="max-w-3xl space-y-6" aria-busy={pending}>
    <h1 className="text-2xl font-bold">Update Option</h1>
    <p className="text-sm text-muted-foreground">Operasi ini hanya menyimpan satu opsi pada pertanyaan yang sudah ada. Retry penolakan opsi tidak menyimpan ulang pertanyaan. Kode kosong disimpan sebagai null; skor 0 tetap valid.</p>
    
    {errors.root&&<p role="alert">{errors.root}</p>}
    {attempt&&<ParameterWriteNotice attempt={attempt} pending={pending} onCheck={()=>{void check();}} onRelease={()=>{if(!running.current)setAttempt(undefined);}}/>}
    <ParameterFields values={values} fields={optionFields} errors={errors} disabled={pending||saved} onChange={(name,value)=>setValues(previous=>({...previous,[name]:value}))}/>
    <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={pending} onClick={()=>router.back()}>Batal</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending||!!attempt||saved}>{pending?"Memproses...":"Update"}</Button></div>
  </form>;
}

