import api from "@/lib/axios";
import { assertEntityResponse, collectPages, isValidEntityId } from "@/lib/managementApi";
import Axios from "axios";
import type { ApiResponse } from "@/types/common";
import type { OrganizationCreateRequest, OrganizationUnit, OrganizationUnitResponse, OrganizationWriteRequest } from "@/types/organizationUnit";

export const getOrganizationUnits = async (page?: number, signal?: AbortSignal) =>
  (
    await api.get<OrganizationUnitResponse>("/organizations", {
      signal,
      params: page ? { page, per_page: 100 } : undefined,
    })
  ).data;
export const getAllOrganizationUnits = (signal?: AbortSignal) => collectPages(page=>getOrganizationUnits(page,signal));

export async function getOrganizationById(id:number,signal?:AbortSignal) {
  if(!isValidEntityId(id))throw new Error("ID organisasi tidak valid.");
  const response=assertEntityResponse((await api.get<ApiResponse<OrganizationUnit>>(`/organizations/${id}`,{signal})).data);
  if(response.data.id!==id)throw new Error("Detail organisasi tidak sesuai ID.");
  return response;
}
export class OrganizationWriteUncertainError extends Error {
  constructor(){super("Hasil penyimpanan organisasi belum dapat dipastikan. Jangan mengulang penyimpanan sebelum memeriksa hasil.");this.name="OrganizationWriteUncertainError";}
}
export function organizationWriteMatches(unit:OrganizationUnit,payload:OrganizationWriteRequest) {
  return Object.entries(payload).every(([key,value])=>unit[key as keyof OrganizationUnit]===value);
}
async function writeOrganization(payload:OrganizationWriteRequest,id?:number) {
  if(id!==undefined&&(!isValidEntityId(id)||Object.hasOwn(payload,"code")||Object.hasOwn(payload,"unit_type")))throw new Error("Perubahan kode/jenis organisasi tidak didukung workflow ini.");
  try {
    const result=id===undefined?await api.post<ApiResponse<OrganizationUnit>>("/organizations",payload):await api.put<ApiResponse<OrganizationUnit>>(`/organizations/${id}`,payload);
    if(result.status!==(id===undefined?201:200)||result.data?.success!==true||!isValidEntityId(result.data?.data?.id)||
      (id!==undefined&&result.data.data.id!==id)||!organizationWriteMatches(result.data.data,payload))throw new OrganizationWriteUncertainError();
    return result.data;
  }catch(error:unknown){
    if(error instanceof OrganizationWriteUncertainError||Axios.isCancel(error))throw error;
    if(Axios.isAxiosError(error)&&error.response&&[400,401,403,404,405,409,415,422,429].includes(error.response.status))throw error;
    throw new OrganizationWriteUncertainError();
  }
}
export const createOrganization=(payload:OrganizationCreateRequest)=>writeOrganization(payload);
export const updateOrganization=(id:number,payload:OrganizationWriteRequest)=>writeOrganization(payload,id);
