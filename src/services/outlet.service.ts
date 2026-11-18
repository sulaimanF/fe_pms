import axios from "@/lib/axios";
import type { Outlet } from "@/types/outlet";
import type { ApiResponse } from "@/types/common";
import { collectPages } from "@/lib/managementApi";
import { assertApiSuccess, assertEntityResponse, isValidEntityId } from "@/lib/managementApi";
import Axios from "axios";
import type { OutletCreateRequest, OutletUpdateRequest } from "@/types/outlet";

export const getOutlets = async (
  organizationUnitId?: number,
  page?: number,
  signal?: AbortSignal,
) => {
  const response =
    await axios.get<ApiResponse<Outlet[]>>(
      "/outlets",
      {
        signal,
        params: {
          organization_unit_id:
            organizationUnitId,
          ...(page ? { page, per_page: 100 } : {}),
        },
      }
    );

  assertApiSuccess(response.data);
  if (!Array.isArray(response.data.data)) throw new Error("Respons daftar Outlet tidak valid.");
  return response.data;
};

export const getAllOutlets = (organizationUnitId?: number, signal?: AbortSignal) => collectPages((page) => getOutlets(organizationUnitId, page, signal));

export const getOutletById = async (id: number, signal?: AbortSignal) => {
  const result = assertEntityResponse((await axios.get<ApiResponse<Outlet>>(`/outlets/${id}`, { signal })).data);
  if (result.data.id !== id) throw new Error("Detail Outlet tidak sesuai dengan ID yang diminta.");
  return result;
};

export class OutletWriteUncertainError extends Error {
  constructor(public readonly entityId?: number) {
    super("Hasil penyimpanan Outlet belum dapat dipastikan. Periksa hasil sebelum mengirim penyimpanan baru.");
    this.name = "OutletWriteUncertainError";
  }
}

function jsonComparable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(jsonComparable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, jsonComparable(item)]));
  return value;
}
export function outletWriteMatches(entity: Partial<Outlet>, payload: OutletUpdateRequest) {
  return Object.entries(payload).every(([key, expected]) => {
    const actual = entity[key as keyof Outlet];
    if (actual === undefined) return false;
    if ((key === "latitude" || key === "longitude") && expected !== null) return actual !== null && Math.abs(Number(actual) - Number(expected)) <= 0.0000001;
    if ((key === "opening_date" || key === "closing_date") && typeof expected === "string") return typeof actual === "string" && actual.slice(0, 10) === expected;
    return JSON.stringify(jsonComparable(actual)) === JSON.stringify(jsonComparable(expected));
  });
}
async function writeOutlet(payload: OutletUpdateRequest, id?: number) {
  let candidateId: number | undefined;
  try {
    const response = id === undefined
      ? await axios.post<ApiResponse<Pick<Outlet, "id"> & Partial<Outlet>>>("/outlets", payload)
      : await axios.put<ApiResponse<Outlet>>(`/outlets/${id}`, payload);
    candidateId = isValidEntityId(response.data?.data?.id) ? response.data.data.id : undefined;
    if (response.status !== (id === undefined ? 201 : 200) || response.data?.success !== true || !candidateId ||
      (id !== undefined && candidateId !== id) || !outletWriteMatches(response.data.data, payload)) throw new OutletWriteUncertainError(candidateId);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof OutletWriteUncertainError) throw error;
    if (Axios.isAxiosError(error) && error.response && [400, 401, 403, 404, 405, 409, 415, 422, 429].includes(error.response.status)) throw error;
    throw new OutletWriteUncertainError(candidateId);
  }
}
export const createOutlet = (payload: OutletCreateRequest) => writeOutlet(payload);
export const updateOutlet = (id: number, payload: OutletUpdateRequest) => writeOutlet(payload, id);
export class OutletDeleteUncertainError extends Error {
  constructor() { super("Hasil penghapusan Outlet belum dapat dipastikan. Periksa hasil sebelum mengulang Delete."); this.name = "OutletDeleteUncertainError"; }
}
export async function deleteOutlet(id: number) {
  try {
    const response = await axios.delete<ApiResponse<null>>(`/outlets/${id}`);
    if (response.status !== 200 || response.data?.success !== true || response.data.data !== null) throw new OutletDeleteUncertainError();
    return response.data;
  } catch (error: unknown) {
    if (error instanceof OutletDeleteUncertainError) throw error;
    if (Axios.isAxiosError(error) && error.response && [400, 401, 403, 404, 405, 409, 422, 429].includes(error.response.status)) throw error;
    throw new OutletDeleteUncertainError();
  }
}
