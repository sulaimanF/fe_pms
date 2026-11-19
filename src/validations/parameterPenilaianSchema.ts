import { z } from "zod";
import { QUESTION_TYPES } from "@/types/parameterPenilaian";
import type { ParameterContainer, ParameterSection, SectionConfiguration, AssessmentPeriod, ParameterQuestion, ParameterOption, ScoringMethod, ScoringRange, SectionRequest, ConfigurationRequest, PeriodRequest, QuestionRequest, OptionRequest, MethodRequest, RangeRequest } from "@/types/parameterPenilaian";

const required = (length?: number) => length ? z.string().trim().min(1, "Wajib diisi.").max(length) : z.string().trim().min(1, "Wajib diisi.");
const id = z.string().refine((v) => /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v)), "Pilih konteks yang valid.");
const order = z.string().refine((v) => /^\d+$/.test(v) && Number.isSafeInteger(Number(v)) && Number(v)<=2147483647, "Urutan harus integer non-negatif dalam batas kolom database.");
export function decimalUnits(value: string) {
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  return BigInt((whole || "0") + fraction.padEnd(2, "0")) * (value.startsWith("-") ? BigInt(-1) : BigInt(1));
}
const decimal = (digits: number, optional = false, minimum?: number, maximum?: number) => z.string().trim().refine((v) => {
  if (v === "") return optional;
  if (!/^-?\d+(\.\d{1,2})?$/.test(v) || v.replace("-", "").split(".")[0].replace(/^0+/, "").length > digits) return false;
  const value = decimalUnits(v);
  return (minimum === undefined || value >= BigInt(minimum * 100)) && (maximum === undefined || value <= BigInt(maximum * 100));
}, "Angka tidak valid: gunakan titik dan maksimal dua desimal sesuai kolom database.");
export function parseParameterJson(value: string): ParameterContainer | null {
  if (!value.trim()) return null;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") throw new Error("Gunakan object/array JSON.");
  return parsed as ParameterContainer;
}
const json = z.string().refine((v) => { try { parseParameterJson(v); return true; } catch { return false; } }, "JSON harus berupa object/array yang valid.");
const operators = ["equals", "not_equals", "in", "not_in", "contains", "not_contains", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"];
export function validParameterCondition(value: unknown, depth = 0): boolean {
  if (value === null) return true;
  if (depth > 32 || !value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  for (const group of ["all", "any"]) if (group in item) return Array.isArray(item[group]) && item[group].length > 0 && item[group].every((child) => validParameterCondition(child, depth + 1));
  if (typeof item.question !== "string" || !item.question || typeof item.operator !== "string" || !operators.includes(item.operator)) return false;
  return ["is_empty", "is_not_empty"].includes(item.operator) ||
    ("value" in item && (!["in", "not_in"].includes(item.operator) || Array.isArray(item.value)));
}
const condition = json.refine((v) => { try { return validParameterCondition(parseParameterJson(v)); } catch { return false; } }, "Gunakan rule {question, operator, value} atau group all/any sesuai backend.");
function reversed(minimum:string,maximum:string) { try { return minimum !== "" && maximum !== "" && decimalUnits(minimum)>decimalUnits(maximum); } catch { return false; } }
const date = z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, "Tanggal tidak valid.");
const section = z.object({ survey_module_id:id, code:required(50).refine((v) => v !== "_default", "Kode _default dicadangkan backend."), name:required(150), description:z.string().trim(), sort_order:order, is_active:z.boolean(), visible_if:condition });
export const createSectionSchema = section;
export const updateSectionSchema = section;
const configuration = z.object({ assessment_period_id:id, weight:decimal(3,false,0,100), target_score:decimal(8,true), minimum_score:decimal(8,true), maximum_score:decimal(8,true), is_active:z.boolean() }).superRefine((v,c) => {
  if (reversed(v.minimum_score,v.maximum_score)) c.addIssue({code:"custom",path:["maximum_score"],message:"Maksimum tidak boleh di bawah minimum."});
});
export const createConfigurationSchema = configuration;
export const updateConfigurationSchema = configuration;
const period = z.object({ year:z.string().refine((v)=>/^\d{4}$/.test(v)&&Number(v)>=2000&&Number(v)<=2100,"Tahun harus 2000–2100."), quarter:z.enum(["1","2","3","4"]), start_date:date, end_date:date, status:z.enum(["draft","active","closed"]) }).superRefine((v,c)=>{
  if(v.start_date>v.end_date)c.addIssue({code:"custom",path:["end_date"],message:"Tanggal akhir tidak boleh sebelum tanggal mulai."});
});
export const createPeriodSchema = period;
export const updatePeriodSchema = period;
const question = z.object({ survey_module_id:id, parameter_section_id:id, code:required(50), type:z.enum(QUESTION_TYPES), question_text:required(), help_text:z.string().trim(), placeholder:z.string().trim().max(255), default_value:z.string().trim().trim(), error_message:z.string().trim().max(255), settings:json, validation_rules:json, visible_if:condition, required_if:condition, weight:decimal(6,false,0), sort_order:order, is_active:z.boolean(), is_required:z.boolean(), is_dynamic:z.boolean() });
export const createQuestionSchema = question;
export const updateQuestionSchema = question;
const option = z.object({ code:z.string().trim().max(50), label:required(255), value:z.string().trim().max(255), score:decimal(6), sort_order:order, is_active:z.boolean() });
export const createOptionSchema = option;
export const updateOptionSchema = option;
const methodFields = { survey_module_id:id, code:required(50), name:required(150), method_type:z.enum(["sum","average","weighted_average","formula"]), is_default:z.boolean(), is_active:z.boolean(), sort_order:order };
export const createMethodSchema = z.object({...methodFields,method_type:z.enum(["sum","average","weighted_average"])});
export const updateMethodSchema = z.object(methodFields);
const range = z.object({ code:required(50), label:required(100), min_score:decimal(8), max_score:decimal(8), color:z.string().trim().max(20), sort_order:order }).superRefine((v,c)=>{
  if(reversed(v.min_score,v.max_score))c.addIssue({code:"custom",path:["max_score"],message:"Maksimum tidak boleh di bawah minimum."});
});
export const createRangeSchema = range;
export const updateRangeSchema = range;
export type SectionValues = z.infer<typeof section>;
export type ConfigurationValues = z.infer<typeof configuration>;
export type PeriodValues = z.infer<typeof period>;
export type QuestionValues = z.infer<typeof question>;
export type OptionValues = z.infer<typeof option>;
export type MethodValues = z.infer<typeof updateMethodSchema>;
export type RangeValues = z.infer<typeof range>;
const nullable = (value:string) => value === "" ? null : value;
const stringify = (value:ParameterContainer|null|undefined) => value == null ? "" : JSON.stringify(value,null,2);
export const emptySection: SectionValues = {survey_module_id:"",code:"",name:"",description:"",sort_order:"0",is_active:true,visible_if:""};
export const emptyConfiguration: ConfigurationValues = {assessment_period_id:"",weight:"",target_score:"",minimum_score:"",maximum_score:"",is_active:true};
export const emptyPeriod: PeriodValues = {year:"",quarter:"1",start_date:"",end_date:"",status:"draft"};
export const emptyQuestion: QuestionValues = {survey_module_id:"",parameter_section_id:"",code:"",type:"text",question_text:"",help_text:"",placeholder:"",default_value:"",error_message:"",settings:"",validation_rules:"",visible_if:"",required_if:"",weight:"1",sort_order:"0",is_active:true,is_required:true,is_dynamic:false};
export const emptyOption: OptionValues = {code:"",label:"",value:"",score:"0",sort_order:"0",is_active:true};
export const emptyMethod: MethodValues = {survey_module_id:"",code:"",name:"",method_type:"sum",is_default:true,is_active:true,sort_order:"0"};
export const emptyRange: RangeValues = {code:"",label:"",min_score:"",max_score:"",color:"",sort_order:"0"};
export const sectionValues = (v:ParameterSection):SectionValues => ({survey_module_id:String(v.survey_module_id),code:v.code,name:v.name,description:v.description??"",sort_order:String(v.sort_order),is_active:v.is_active,visible_if:stringify(v.visible_if)});
export const configurationValues = (v:SectionConfiguration):ConfigurationValues => ({assessment_period_id:String(v.assessment_period_id),weight:v.weight,target_score:v.target_score??"",minimum_score:v.minimum_score??"",maximum_score:v.maximum_score??"",is_active:v.is_active});
export const periodValues = (v:AssessmentPeriod):PeriodValues => ({year:String(v.year),quarter:String(v.quarter) as PeriodValues["quarter"],start_date:v.start_date.slice(0,10),end_date:v.end_date.slice(0,10),status:v.status});
export const questionValues = (v:ParameterQuestion):QuestionValues => ({survey_module_id:String(v.survey_module_id),parameter_section_id:v.parameter_section_id===null?"":String(v.parameter_section_id),code:v.code,type:v.type,question_text:v.question_text,help_text:v.help_text??"",placeholder:v.placeholder??"",default_value:v.default_value??"",error_message:v.error_message??"",settings:stringify(v.settings),validation_rules:stringify(v.validation_rules),visible_if:stringify(v.visible_if),required_if:stringify(v.required_if),weight:v.weight,sort_order:String(v.sort_order),is_active:v.is_active,is_required:v.is_required,is_dynamic:v.is_dynamic});
export const optionValues = (v:ParameterOption):OptionValues => ({code:v.code??"",label:v.label,value:v.value??"",score:v.score,sort_order:String(v.sort_order),is_active:v.is_active});
export const methodValues = (v:ScoringMethod):MethodValues => ({survey_module_id:String(v.survey_module_id),code:v.code,name:v.name,method_type:v.method_type,is_default:v.is_default,is_active:v.is_active,sort_order:String(v.sort_order)});
export const rangeValues = (v:ScoringRange):RangeValues => ({code:v.code,label:v.label,min_score:v.min_score,max_score:v.max_score,color:v.color??"",sort_order:String(v.sort_order)});
export const buildSection = (v:SectionValues):SectionRequest => ({...v,survey_module_id:Number(v.survey_module_id),description:nullable(v.description),sort_order:Number(v.sort_order),visible_if:parseParameterJson(v.visible_if)});
export const buildConfiguration = (v:ConfigurationValues):ConfigurationRequest => ({...v,assessment_period_id:Number(v.assessment_period_id),target_score:nullable(v.target_score),minimum_score:nullable(v.minimum_score),maximum_score:nullable(v.maximum_score)});
export const buildPeriod = (v:PeriodValues):PeriodRequest => ({...v,year:Number(v.year),quarter:Number(v.quarter)});
export const buildQuestion = (v:QuestionValues):QuestionRequest => ({...v,survey_module_id:Number(v.survey_module_id),parameter_section_id:Number(v.parameter_section_id),help_text:nullable(v.help_text),placeholder:nullable(v.placeholder),default_value:nullable(v.default_value),error_message:nullable(v.error_message),settings:parseParameterJson(v.settings),validation_rules:parseParameterJson(v.validation_rules),visible_if:parseParameterJson(v.visible_if),required_if:parseParameterJson(v.required_if),sort_order:Number(v.sort_order)});
export const buildOption = (v:OptionValues):OptionRequest => ({...v,code:nullable(v.code),value:nullable(v.value),sort_order:Number(v.sort_order)});
export const buildMethod = (v:MethodValues):MethodRequest => ({...v,survey_module_id:Number(v.survey_module_id),sort_order:Number(v.sort_order)});
export const buildRange = (v:RangeValues):RangeRequest => ({...v,color:nullable(v.color),sort_order:Number(v.sort_order)});
export function parameterChanges<T extends object>(current:T, baseline:T):Partial<T> {
  const result:Partial<T>={};
  for(const key of Object.keys(current) as (keyof T)[])if(JSON.stringify(current[key])!==JSON.stringify(baseline[key]))Object.assign(result,{[key]:current[key]});
  return result;
}
export function updateConfigurationPayload(v:ConfigurationValues, baseline:ConfigurationValues) {
  const result=parameterChanges(buildConfiguration(v),buildConfiguration(baseline));
  delete result.assessment_period_id;
  if("minimum_score" in result||"maximum_score" in result){result.minimum_score=nullable(v.minimum_score);result.maximum_score=nullable(v.maximum_score);}
  return result;
}
export function updatePeriodPayload(v:PeriodValues, baseline:PeriodValues) {
  const result=parameterChanges(buildPeriod(v),buildPeriod(baseline));
  if("year" in result||"quarter" in result){result.year=Number(v.year);result.quarter=Number(v.quarter);}
  if("start_date" in result||"end_date" in result){result.start_date=v.start_date;result.end_date=v.end_date;}
  return result;
}
export function updateRangePayload(v:RangeValues, baseline:RangeValues) {
  const result=parameterChanges(buildRange(v),buildRange(baseline));
  if("min_score" in result||"max_score" in result){result.min_score=v.min_score;result.max_score=v.max_score;}
  return result;
}

