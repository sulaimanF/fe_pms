"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  useParameterList,
  useSurveyContexts,
} from "@/hooks/useParameterPenilaian";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ParameterReadBoundary } from "./ParameterFeedback";
import {
  parameterId,
  parameterLink,
  parameterRoot,
} from "@/lib/parameterPenilaian";

export function useParameterContext() {
  const search = useSearchParams();
  return {
    surveyId: parameterId(search.get("survey")),
    periodId: parameterId(search.get("period")),
  };
}
export function ParameterNavigation() {
  const { surveyId, periodId } = useParameterContext(),
    pathname = usePathname();
  return (
    <nav
      aria-label="Parameter Penilaian"
      className="mb-6 flex flex-wrap gap-4 border-b pb-4"
    >
      {[
        [parameterRoot, "Section Parameter"],
        [parameterRoot + "/periods", "Periode Penilaian"],
        [parameterRoot + "/scoring", "Metode Scoring"],
      ].map(([path, label]) => (
        <Link
          key={path}
          href={parameterLink(path, surveyId, periodId)}
          aria-current={pathname === path ? "page" : undefined}
          className="font-medium text-blue-700 hover:underline"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function ParameterContextSelectors({
  children,
}: {
  children: React.ReactNode;
}) {
  const surveys = useSurveyContexts(),
    periods = useParameterList("periods"),
    { surveyId, periodId } = useParameterContext(),
    router = useRouter(),
    pathname = usePathname();
  return (
    <ParameterReadBoundary
      data={surveys.data}
      error={surveys.error}
      fetching={surveys.isFetching}
      retry={() => {
        void surveys.refetch();
      }}
    >
      <ParameterReadBoundary
        data={periods.data}
        error={periods.error}
        fetching={periods.isFetching}
        retry={() => {
          void periods.refetch();
        }}
      >
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="parameter-survey">Survey Module</label>
            <Select
              value={Number.isSafeInteger(surveyId) ? String(surveyId) : "none"}
              onValueChange={(value) =>
                router.replace(
                  parameterLink(
                    pathname,
                    value === "none" ? undefined : Number(value),
                    periodId,
                  ),
                )
              }
            >
              <SelectTrigger id="parameter-survey" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pilih Survey Module</SelectItem>
                {surveys.data?.data.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.title} ({item.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!surveys.data?.data.length && (
              <p>
                Tidak ada Survey Module. Pembuatan Survey Module berada di luar
                menu ini.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="parameter-period">Konteks periode</label>
            <Select
              value={Number.isSafeInteger(periodId) ? String(periodId) : "none"}
              onValueChange={(value) =>
                router.replace(
                  parameterLink(
                    pathname,
                    surveyId,
                    value === "none" ? undefined : Number(value),
                  ),
                )
              }
            >
              <SelectTrigger id="parameter-period" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Semua periode / belum dipilih
                </SelectItem>
                {periods.data?.data.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.year} Q{item.quarter} ({item.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {Number.isSafeInteger(surveyId) &&
        !surveys.data?.data.some((item) => item.id === surveyId) ? (
          <p role="alert">
            Survey Module pada URL tidak tersedia dalam lookup.
          </p>
        ) : (
          children
        )}
      </ParameterReadBoundary>
    </ParameterReadBoundary>
  );
}
