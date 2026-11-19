import type {
  ParameterFilters,
  ParameterResource,
} from "@/types/parameterPenilaian";
import {
  getParameterDetail,
  getParameterList,
  parameterPayloadMatches,
} from "@/services/parameterPenilaian.services";
import { assertParameterAccess } from "@/lib/parameterAuthorization";
import { captureSession, requestInSession } from "@/lib/session";

export const parameterRoot = "/parameterPenilaian";
export const parameterLabels: Record<ParameterResource, string> = {
  sections: "Section Parameter",
  configurations: "Konfigurasi Periode",
  periods: "Periode Penilaian",
  questions: "Pertanyaan",
  options: "Opsi Pertanyaan",
  methods: "Metode Scoring",
  ranges: "Rentang Scoring",
};
export const parameterRoute: Record<ParameterResource, string> = {
  sections: "sections",
  configurations: "configurations",
  periods: "periods",
  questions: "questions",
  options: "options",
  methods: "scoring",
  ranges: "ranges",
};
export function parameterId(value: string | string[] | null | undefined) {
  return typeof value === "string" &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))
    ? Number(value)
    : NaN;
}
export function parameterLink(
  path: string,
  surveyId?: number,
  periodId?: number,
) {
  const params = new URLSearchParams();
  if (Number.isSafeInteger(surveyId) && surveyId! > 0)
    params.set("survey", String(surveyId));
  if (Number.isSafeInteger(periodId) && periodId! > 0)
    params.set("period", String(periodId));
  return params.size ? path + "?" + params.toString() : path;
}
export function parameterText(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Active" : "Inactive";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
export async function checkParameterResult(
  resource: ParameterResource,
  payload: object,
  filters: ParameterFilters,
  id?: number,
) {
  const context = captureSession(),
    controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const rows = await requestInSession(context.id, () => {
      assertParameterAccess(context.id);
      return id === undefined
        ? getParameterList(resource, filters, controller.signal).then(
            (r) => r.data,
          )
        : getParameterDetail(resource, id, controller.signal).then((r) => [
            r.data,
          ]);
    });
    const expected = payload as Record<string, unknown>;
    const identifiers =
      resource === "periods"
        ? ["year", "quarter"]
        : resource === "configurations"
          ? ["assessment_period_id"]
          : ["code"];
    const candidates =
      id === undefined
        ? rows.filter((row) =>
            identifiers.every(
              (key) =>
                expected[key] != null &&
                (row as unknown as Record<string, unknown>)[key] ===
                  expected[key],
            ),
          )
        : rows;
    if (candidates.length !== 1)
      return "Identitas hasil belum dapat dipastikan. Data tidak ditemukan atau kandidat ambigu bukan bukti request gagal. Tidak ada mutation yang diulang.";
    return (
      (parameterPayloadMatches(candidates[0], payload)
        ? "Field terbaca sesuai snapshot."
        : "Field terbaca belum sesuai snapshot.") +
      " Pembacaan ini bukan bukti identitas operasi sebelumnya. Hasil masih belum pasti; tidak ada mutation yang diulang."
    );
  } finally {
    clearTimeout(timer);
  }
}
