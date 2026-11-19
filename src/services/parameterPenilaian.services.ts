import axios from "axios";
import api from "@/lib/axios";
import {
  assertApiSuccess,
  assertEntityResponse,
  collectPages,
  isValidEntityId,
} from "@/lib/managementApi";
import type { ApiResponse } from "@/types/common";
import type {
  ParameterEntities,
  ParameterFilters,
  ParameterRequests,
  ParameterResource,
  ParameterWrite,
  SurveyContext,
} from "@/types/parameterPenilaian";

const paths: Record<ParameterResource, string> = {
  sections: "/parameter-sections",
  configurations: "/parameter-section-configurations",
  periods: "/assessment-periods",
  questions: "/questions",
  options: "/question-options",
  methods: "/scoring-methods",
  ranges: "/scoring-ranges",
};
const nested: Partial<
  Record<ParameterResource, { path: string; suffix: string }>
> = {
  configurations: { path: "/parameter-sections", suffix: "configurations" },
  options: { path: "/questions", suffix: "options" },
  ranges: { path: "/scoring-methods", suffix: "ranges" },
};
function collectionPath(resource: ParameterResource, parentId?: number) {
  const relation = nested[resource];
  if (!relation) return paths[resource];
  if (!isValidEntityId(parentId)) throw new Error("Konteks induk tidak valid.");
  return `${relation.path}/${parentId}/${relation.suffix}`;
}
function assertRows<T extends { id: number }>(response: ApiResponse<T[]>) {
  assertApiSuccess(response);
  if (
    !Array.isArray(response.data) ||
    response.data.some((item) => !item || !isValidEntityId(item.id))
  )
    throw new Error("Respons daftar tidak valid.");
  return response;
}
export function getParameterList<K extends ParameterResource>(
  resource: K,
  filters: ParameterFilters = {},
  signal?: AbortSignal,
) {
  const url = collectionPath(resource, filters.parentId);
  const params = {
    survey_module_id: filters.survey_module_id,
    parameter_section_id: filters.parameter_section_id,
  };
  const read = async (page?: number) =>
    assertRows(
      (
        await api.get<ApiResponse<ParameterEntities[K][]>>(url, {
          signal,
          params: { ...params, ...(page ? { page, per_page: 100 } : {}) },
        })
      ).data,
    );
  return nested[resource] ? read() : collectPages((page) => read(page));
}
export function getSurveyContexts(signal?: AbortSignal) {
  return collectPages(async (page) =>
    assertRows(
      (
        await api.get<ApiResponse<SurveyContext[]>>("/survey-modules", {
          signal,
          params: { page, per_page: 100 },
        })
      ).data,
    ),
  );
}
export async function getParameterDetail<K extends ParameterResource>(
  resource: K,
  id: number,
  signal?: AbortSignal,
) {
  if (!isValidEntityId(id)) throw new Error("ID tidak valid.");
  const response = assertEntityResponse(
    (
      await api.get<ApiResponse<ParameterEntities[K]>>(
        `${paths[resource]}/${id}`,
        { signal },
      )
    ).data,
  );
  if (response.data.id !== id) throw new Error("Detail tidak sesuai ID.");
  return response;
}
export class ParameterUncertainError extends Error {
  constructor(public readonly entityId?: number) {
    super(
      "Hasil operasi belum dapat dipastikan. Periksa hasil sebelum mengirim operasi baru.",
    );
    this.name = "ParameterUncertainError";
  }
}
function comparable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    // Eloquent array casts serialize an empty associative object as [].
    return entries.length
      ? Object.fromEntries(
          entries.map(([key, item]) => [key, comparable(item)]),
        )
      : [];
  }
  return value;
}
const decimals = new Set([
  "weight",
  "target_score",
  "minimum_score",
  "maximum_score",
  "min_score",
  "max_score",
  "score",
]);
function decimalText(value: unknown) {
  return String(value)
    .replace(/^(-?)0+(?=\d)/, "$1")
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "")
    .replace(/^-0$/, "0");
}
export function parameterPayloadMatches(entity: object, payload: object) {
  const row = entity as Record<string, unknown>;
  return Object.entries(payload).every(([key, value]) => {
    const actual = row[key];
    if (actual === undefined) return false;
    if (decimals.has(key) && value !== null && actual !== null)
      return decimalText(actual) === decimalText(value);
    if (["start_date", "end_date"].includes(key) && typeof value === "string")
      return typeof actual === "string" && actual.slice(0, 10) === value;
    return (
      JSON.stringify(comparable(actual)) === JSON.stringify(comparable(value))
    );
  });
}
const rejection = (error: unknown) =>
  axios.isAxiosError(error) &&
  !!error.response &&
  [400, 401, 403, 404, 405, 409, 415, 422, 429].includes(error.response.status);
export async function createParameter<K extends ParameterResource>(
  resource: K,
  payload: ParameterRequests[K],
  parentId?: number,
) {
  return writeParameter(resource, payload, undefined, parentId);
}
export async function updateParameter<K extends ParameterResource>(
  resource: K,
  id: number,
  payload: Partial<ParameterRequests[K]>,
) {
  return writeParameter(resource, payload, id);
}
async function writeParameter<K extends ParameterResource>(
  resource: K,
  payload: Partial<ParameterRequests[K]>,
  id?: number,
  parentId?: number,
) {
  const url =
    id === undefined
      ? collectionPath(resource, parentId)
      : `${paths[resource]}/${id}`;
  if (id !== undefined && !isValidEntityId(id))
    throw new Error("ID tidak valid.");
  let candidateId: number | undefined;
  try {
    const response =
      id === undefined
        ? await api.post<ParameterWrite<K>>(url, payload)
        : await api.put<ParameterWrite<K>>(url, payload);
    candidateId = isValidEntityId(response.data?.data?.id)
      ? response.data.data.id
      : undefined;
    if (
      response.status !== (id === undefined ? 201 : 200) ||
      response.data?.success !== true ||
      !candidateId ||
      (id !== undefined && candidateId !== id) ||
      !parameterPayloadMatches(response.data.data, payload)
    )
      throw new ParameterUncertainError(candidateId);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof ParameterUncertainError || rejection(error))
      throw error;
    throw new ParameterUncertainError(candidateId);
  }
}
export async function deleteParameter(resource: ParameterResource, id: number) {
  if (!isValidEntityId(id)) throw new Error("ID tidak valid.");
  try {
    const response = await api.delete<ApiResponse<null>>(
      `${paths[resource]}/${id}`,
    );
    if (
      response.status !== 200 ||
      response.data?.success !== true ||
      response.data.data !== null
    )
      throw new ParameterUncertainError(id);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof ParameterUncertainError || rejection(error))
      throw error;
    throw new ParameterUncertainError(id);
  }
}
