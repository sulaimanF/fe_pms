"use client";

import { Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  useParameterDetail,
  useParameterList,
  useSurveyContexts,
} from "@/hooks/useParameterPenilaian";
import { useSessionQuery } from "@/hooks/useAuth";
import { ParameterReadBoundary } from "./ParameterFeedback";
import {
  useParameterContext,
  ParameterContextSelectors,
} from "./ParameterNavigation";
import ParameterCollection, {
  ParameterAttributes,
} from "./ParameterCollection";
import {
  parameterId,
  parameterLink,
  parameterRoot,
} from "@/lib/parameterPenilaian";
import type {
  ParameterEntities,
  ParameterResource,
} from "@/types/parameterPenilaian";
import CreateSectionForm from "./CreateSectionForm";
import UpdateSectionForm from "./UpdateSectionForm";
import CreateConfigurationForm from "./CreateConfigurationForm";
import UpdateConfigurationForm from "./UpdateConfigurationForm";
import CreatePeriodForm from "./CreatePeriodForm";
import UpdatePeriodForm from "./UpdatePeriodForm";
import CreateQuestionForm from "./CreateQuestionForm";
import UpdateQuestionForm from "./UpdateQuestionForm";
import CreateOptionForm from "./CreateOptionForm";
import UpdateOptionForm from "./UpdateOptionForm";
import CreateMethodForm from "./CreateMethodForm";
import UpdateMethodForm from "./UpdateMethodForm";
import CreateRangeForm from "./CreateRangeForm";
import UpdateRangeForm from "./UpdateRangeForm";

function EntityReader<K extends ParameterResource>({
  resource,
  id,
  children,
}: {
  resource: K;
  id: number;
  children: (row: ParameterEntities[K]) => React.ReactNode;
}) {
  const query = useParameterDetail(resource, id),
    session = useSessionQuery();
  if (!Number.isSafeInteger(id) || id <= 0)
    return <p role="alert">ID tidak valid.</p>;
  return (
    <ParameterReadBoundary
      data={query.data}
      error={query.error}
      fetching={query.isFetching}
      retry={() => {
        void query.refetch();
      }}
    >
      {query.data?.data.id === id && (
        <Fragment key={session.id + ":" + resource + ":" + id}>
          {children(query.data.data)}
        </Fragment>
      )}
    </ParameterReadBoundary>
  );
}
function Back({ href }: { href: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={href}>Kembali</Link>
    </Button>
  );
}
export function SectionsPage() {
  const { surveyId, periodId } = useParameterContext();
  return (
    <ParameterContextSelectors>
      {Number.isSafeInteger(surveyId) ? (
        <ParameterCollection
          key={"sections:" + surveyId}
          resource="sections"
          filters={{ survey_module_id: surveyId }}
          surveyId={surveyId}
          periodId={periodId}
          createPath={parameterRoot + "/sections/create"}
        />
      ) : (
        <p>Pilih Survey Module untuk melihat section parameter.</p>
      )}
    </ParameterContextSelectors>
  );
}
export function PeriodsPage() {
  const { surveyId, periodId } = useParameterContext();
  return (
    <ParameterContextSelectors>
      <ParameterCollection
        resource="periods"
        surveyId={surveyId}
        periodId={periodId}
        createPath={parameterRoot + "/periods/create"}
      />
    </ParameterContextSelectors>
  );
}
export function MethodsPage() {
  const { surveyId, periodId } = useParameterContext();
  return (
    <ParameterContextSelectors>
      {Number.isSafeInteger(surveyId) ? (
        <ParameterCollection
          key={"methods:" + surveyId}
          resource="methods"
          filters={{ survey_module_id: surveyId }}
          surveyId={surveyId}
          periodId={periodId}
          createPath={parameterRoot + "/scoring/create"}
          description="Scoring umum terpisah dari bobot section internal_score. Formula belum dievaluasi backend."
        />
      ) : (
        <p>Pilih Survey Module untuk melihat metode scoring.</p>
      )}
    </ParameterContextSelectors>
  );
}
export function SectionCreatePage() {
  const surveys = useSurveyContexts(),
    { surveyId, periodId } = useParameterContext();
  return (
    <ParameterReadBoundary
      data={surveys.data}
      error={surveys.error}
      fetching={surveys.isFetching}
      retry={() => {
        void surveys.refetch();
      }}
    >
      {surveys.data && (
        <CreateSectionForm
          surveys={surveys.data.data}
          initialSurveyId={surveyId}
          periodId={periodId}
        />
      )}
    </ParameterReadBoundary>
  );
}
export function SectionUpdatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="sections" id={id}>
      {(section) => <UpdateSectionForm section={section} periodId={periodId} />}
    </EntityReader>
  );
}
export function SectionDetailPage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="sections" id={id}>
      {(section) => (
        <div className="space-y-6">
          <Back
            href={parameterLink(
              parameterRoot,
              section.survey_module_id,
              periodId,
            )}
          />
          <h1 className="text-2xl font-bold">{section.name}</h1>
          <p>
            Survey Module:{" "}
            {section.survey_module?.title ?? section.survey_module_id}. Konteks
            periode: {Number.isSafeInteger(periodId) ? periodId : "semua"}.
            Konfigurasi ditampilkan untuk seluruh periode.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link
              href={parameterLink(
                parameterRoot + "/sections/" + id + "/update",
                section.survey_module_id,
                periodId,
              )}
            >
              Edit Section
            </Link>
          </Button>
          <ParameterAttributes row={section} />
          <ParameterCollection
            resource="configurations"
            filters={{ parentId: id }}
            surveyId={section.survey_module_id}
            periodId={periodId}
            createPath={
              parameterRoot + "/sections/" + id + "/configurations/create"
            }
            description="Bobot section 0–100. Total 100% dan penguncian closed belum diwajibkan backend."
          />
          <ParameterCollection
            resource="questions"
            filters={{
              survey_module_id: section.survey_module_id,
              parameter_section_id: id,
            }}
            surveyId={section.survey_module_id}
            periodId={periodId}
            createPath={parameterRoot + "/sections/" + id + "/questions/create"}
            description="Pertanyaan disimpan terpisah dari opsi. Gunakan detail pertanyaan untuk mengelola opsi."
          />
        </div>
      )}
    </EntityReader>
  );
}
export function ConfigurationCreatePage() {
  const id = parameterId(useParams().id),
    periods = useParameterList("periods"),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="sections" id={id}>
      {(section) => (
        <ParameterReadBoundary
          data={periods.data}
          error={periods.error}
          fetching={periods.isFetching}
          retry={() => {
            void periods.refetch();
          }}
        >
          {periods.data && (
            <CreateConfigurationForm
              section={section}
              periods={periods.data.data}
              initialPeriodId={periodId}
            />
          )}
        </ParameterReadBoundary>
      )}
    </EntityReader>
  );
}
export function ConfigurationUpdatePage() {
  const id = parameterId(useParams().id);
  return (
    <EntityReader resource="configurations" id={id}>
      {(configuration) => (
        <>
          <p className="mb-4">
            Periode:{" "}
            {configuration.assessment_period
              ? configuration.assessment_period.year +
                " Q" +
                configuration.assessment_period.quarter +
                " (" +
                configuration.assessment_period.status +
                ")"
              : configuration.assessment_period_id}
            .
          </p>
          <UpdateConfigurationForm configuration={configuration} />
        </>
      )}
    </EntityReader>
  );
}
export function PeriodCreatePage() {
  const { surveyId } = useParameterContext();
  return <CreatePeriodForm surveyId={surveyId} />;
}
export function PeriodUpdatePage() {
  const id = parameterId(useParams().id),
    { surveyId } = useParameterContext();
  return (
    <EntityReader resource="periods" id={id}>
      {(period) => <UpdatePeriodForm period={period} surveyId={surveyId} />}
    </EntityReader>
  );
}
export function PeriodDetailPage() {
  const id = parameterId(useParams().id),
    { surveyId } = useParameterContext();
  return (
    <EntityReader resource="periods" id={id}>
      {(period) => (
        <div className="space-y-4">
          <Back
            href={parameterLink(parameterRoot + "/periods", surveyId, id)}
          />
          <h1 className="text-2xl font-bold">
            {period.year} Q{period.quarter}
          </h1>
          <ParameterAttributes row={period} />
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link
              href={parameterLink(
                parameterRoot + "/periods/" + id + "/update",
                surveyId,
                id,
              )}
            >
              Edit Periode
            </Link>
          </Button>
          <p>
            Konfigurasi per periode dikelola dari detail section. Status closed
            belum mengunci konfigurasi di backend.
          </p>
        </div>
      )}
    </EntityReader>
  );
}
export function QuestionCreatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="sections" id={id}>
      {(section) => (
        <CreateQuestionForm section={section} periodId={periodId} />
      )}
    </EntityReader>
  );
}
export function QuestionUpdatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="questions" id={id}>
      {(question) =>
        question.parameter_section_id ? (
          <UpdateQuestionForm question={question} periodId={periodId} />
        ) : (
          <p role="alert">
            Pertanyaan ini tidak memiliki section. Assignment ke section perlu
            ditentukan melalui workflow yang sesuai.
          </p>
        )
      }
    </EntityReader>
  );
}
export function QuestionDetailPage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="questions" id={id}>
      {(question) => (
        <div className="space-y-6">
          <Back
            href={parameterLink(
              question.parameter_section_id
                ? parameterRoot + "/sections/" + question.parameter_section_id
                : parameterRoot,
              question.survey_module_id,
              periodId,
            )}
          />
          <h1 className="text-2xl font-bold">{question.code}</h1>
          <ParameterAttributes row={question} />
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link
              href={parameterLink(
                parameterRoot + "/questions/" + id + "/update",
                question.survey_module_id,
                periodId,
              )}
            >
              Edit Pertanyaan
            </Link>
          </Button>
          <p>
            Opsi relevan untuk pilihan, matrix, serta pemetaan skor
            rating/scale. Pertanyaan sudah tersimpan; kegagalan operasi opsi
            tidak memerlukan pembuatan ulang pertanyaan.
          </p>
          <ParameterCollection
            resource="options"
            filters={{ parentId: id }}
            surveyId={question.survey_module_id}
            periodId={periodId}
            createPath={parameterRoot + "/questions/" + id + "/options/create"}
          />
        </div>
      )}
    </EntityReader>
  );
}
export function OptionCreatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="questions" id={id}>
      {(question) => (
        <CreateOptionForm question={question} periodId={periodId} />
      )}
    </EntityReader>
  );
}
export function OptionUpdatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="options" id={id}>
      {(option) => (
        <EntityReader resource="questions" id={option.question_id}>
          {(question) => (
            <UpdateOptionForm
              option={option}
              question={question}
              periodId={periodId}
            />
          )}
        </EntityReader>
      )}
    </EntityReader>
  );
}
export function MethodCreatePage() {
  const surveys = useSurveyContexts(),
    { surveyId, periodId } = useParameterContext();
  return (
    <ParameterReadBoundary
      data={surveys.data}
      error={surveys.error}
      fetching={surveys.isFetching}
      retry={() => {
        void surveys.refetch();
      }}
    >
      {surveys.data && (
        <CreateMethodForm
          surveys={surveys.data.data}
          initialSurveyId={surveyId}
          periodId={periodId}
        />
      )}
    </ParameterReadBoundary>
  );
}
export function MethodUpdatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="methods" id={id}>
      {(method) => <UpdateMethodForm method={method} periodId={periodId} />}
    </EntityReader>
  );
}
export function MethodDetailPage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="methods" id={id}>
      {(method) => (
        <div className="space-y-6">
          <Back
            href={parameterLink(
              parameterRoot + "/scoring",
              method.survey_module_id,
              periodId,
            )}
          />
          <h1 className="text-2xl font-bold">{method.name}</h1>
          {method.method_type === "formula" && (
            <p role="alert">
              Data ini memakai formula, tetapi engine belum mengevaluasinya dan
              masih fallback ke sum. Metode tidak diubah otomatis.
            </p>
          )}
          <ParameterAttributes row={method} />
          <p>
            Configuration JSON disimpan backend tetapi belum digunakan
            computeScore(). Tidak ada evaluator scoring di FE.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link
              href={parameterLink(
                parameterRoot + "/scoring/" + id + "/update",
                method.survey_module_id,
                periodId,
              )}
            >
              Edit Metode
            </Link>
          </Button>
          <ParameterCollection
            resource="ranges"
            filters={{ parentId: id }}
            surveyId={method.survey_module_id}
            periodId={periodId}
            createPath={parameterRoot + "/scoring/" + id + "/ranges/create"}
            description="Batas minimum/maksimum inklusif. Backend belum melarang overlap rentang."
          />
        </div>
      )}
    </EntityReader>
  );
}
export function RangeCreatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="methods" id={id}>
      {(method) => <CreateRangeForm method={method} periodId={periodId} />}
    </EntityReader>
  );
}
export function RangeUpdatePage() {
  const id = parameterId(useParams().id),
    { periodId } = useParameterContext();
  return (
    <EntityReader resource="ranges" id={id}>
      {(range) => (
        <EntityReader resource="methods" id={range.scoring_method_id}>
          {(method) => (
            <UpdateRangeForm
              range={range}
              method={method}
              periodId={periodId}
            />
          )}
        </EntityReader>
      )}
    </EntityReader>
  );
}
