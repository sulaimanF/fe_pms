"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTables from "@/components/tables/DataTables";
import DataTablesActions from "@/components/tables/DataTablesActions";
import DataTablesSearch from "@/components/tables/DataTablesSearch";
import ConfirmDialogs from "@/components/dialogs/ConfirmDialogs";
import { useDataTable } from "@/hooks/useDataTable";
import {
  useDeleteParameter,
  useParameterDetail,
  useParameterList,
} from "@/hooks/useParameterPenilaian";
import { useSessionQuery } from "@/hooks/useAuth";
import { canManageParameters } from "@/lib/parameterAuthorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import {
  parameterLabels,
  parameterLink,
  parameterRoot,
  parameterRoute,
  parameterText,
} from "@/lib/parameterPenilaian";
import { ParameterUncertainError } from "@/services/parameterPenilaian.services";
import {
  ParameterReadBoundary,
  parameterRequestErrors,
} from "./ParameterFeedback";
import type {
  ParameterEntities,
  ParameterFilters,
  ParameterResource,
} from "@/types/parameterPenilaian";

type Row = ParameterEntities[ParameterResource];
const columnsByResource: Record<
  ParameterResource,
  readonly [string, string][]
> = {
  sections: [
    ["code", "Kode"],
    ["name", "Nama"],
    ["questions_count", "Pertanyaan"],
    ["sort_order", "Urutan"],
    ["is_active", "Aktif"],
  ],
  configurations: [
    ["assessment_period_id", "Periode ID"],
    ["weight", "Bobot (%)"],
    ["target_score", "Target"],
    ["minimum_score", "Minimum"],
    ["maximum_score", "Maksimum"],
    ["is_active", "Aktif"],
  ],
  periods: [
    ["year", "Tahun"],
    ["quarter", "Quarter"],
    ["start_date", "Mulai"],
    ["end_date", "Akhir"],
    ["status", "Status"],
  ],
  questions: [
    ["code", "Kode"],
    ["question_text", "Pertanyaan"],
    ["type", "Jenis"],
    ["weight", "Bobot"],
    ["sort_order", "Urutan"],
    ["is_active", "Aktif"],
  ],
  options: [
    ["code", "Kode"],
    ["label", "Label"],
    ["value", "Value"],
    ["score", "Skor"],
    ["sort_order", "Urutan"],
    ["is_active", "Aktif"],
  ],
  methods: [
    ["code", "Kode"],
    ["name", "Nama"],
    ["method_type", "Metode"],
    ["is_default", "Default"],
    ["is_active", "Aktif"],
  ],
  ranges: [
    ["code", "Kode"],
    ["label", "Label"],
    ["min_score", "Minimum"],
    ["max_score", "Maksimum"],
    ["color", "Warna"],
    ["sort_order", "Urutan"],
  ],
};
function detailFields(row: Row) {
  return Object.entries(row).filter(
    ([key]) =>
      !["questions", "configurations", "options", "ranges"].includes(key),
  );
}
export function ParameterAttributes({ row }: { row: Row }) {
  return (
    <dl className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
      {detailFields(row).map(([key, value]) => (
        <div key={key}>
          <dt className="font-medium">{key}</dt>
          <dd className="break-words whitespace-pre-wrap">
            {parameterText(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Details({
  resource,
  id,
  onClose,
}: {
  resource: ParameterResource;
  id: number;
  onClose: () => void;
}) {
  const query = useParameterDetail(resource, id);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{parameterLabels[resource]}</DialogTitle>
          <DialogDescription>
            Detail data dari backend pada konteks yang dipilih.
          </DialogDescription>
        </DialogHeader>
        <ParameterReadBoundary
          data={query.data}
          error={query.error}
          fetching={query.isFetching}
          retry={() => {
            void query.refetch();
          }}
        >
          {query.data && <ParameterAttributes row={query.data.data} />}
        </ParameterReadBoundary>
      </DialogContent>
    </Dialog>
  );
}
export default function ParameterCollection({
  resource,
  filters = {},
  surveyId,
  periodId,
  createPath,
  description,
}: {
  resource: ParameterResource;
  filters?: ParameterFilters;
  surveyId?: number;
  periodId?: number;
  createPath?: string;
  description?: string;
}) {
  const query = useParameterList(resource, filters),
    mutation = useDeleteParameter(resource),
    session = useSessionQuery(),
    router = useRouter();
  const [detail, setDetail] = useState<number>(),
    [target, setTarget] = useState<Row>();
  const [uncertain, setUncertain] = useState<string>(),
    [checking, setChecking] = useState(false);
  const running = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const fields = columnsByResource[resource];
  const columns: ColumnDef<Row>[] = fields.map(([key, label]) => ({
    id: key,
    header: label,
    accessorFn: (row) => {
      if (
        key === "assessment_period_id" &&
        "assessment_period" in row &&
        row.assessment_period
      )
        return (
          row.assessment_period.year +
          " Q" +
          row.assessment_period.quarter +
          " (" +
          row.assessment_period.status +
          ")"
        );
      return parameterText((row as unknown as Record<string, unknown>)[key]);
    },
  }));
  const path = (id: number) =>
    parameterLink(
      parameterRoot + "/" + parameterRoute[resource] + "/" + id,
      surveyId,
      periodId,
    );
  const view = (row: Row) => {
    if (!canManageParameters()) return;
    if (["sections", "questions", "periods", "methods"].includes(resource))
      router.push(path(row.id));
    else setDetail(row.id);
  };
  columns.push({
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DataTablesActions
        variant="inline"
        row={row.original}
        onView={view}
        onEdit={(item) => {
          if (canManageParameters() && !running.current)
            router.push(
              parameterLink(
                parameterRoot +
                  "/" +
                  parameterRoute[resource] +
                  "/" +
                  item.id +
                  "/update",
                surveyId,
                periodId,
              ),
            );
        }}
        onDelete={
          !uncertain && !mutation.isPending
            ? (item) => {
                if (canManageParameters() && !running.current) setTarget(item);
              }
            : undefined
        }
      />
    ),
  });
  const { table } = useDataTable({ data: rows, columns });
  const remove = async () => {
    if (!target || running.current || uncertain || !canManageParameters())
      return;
    const context = captureSession(),
      id = target.id;
    running.current = true;
    try {
      const result = await mutation.mutateAsync(id);
      if (
        !mounted.current ||
        !isCurrentSession(context) ||
        !canManageParameters()
      )
        return;
      setTarget(undefined);
      setDetail(undefined);
      const message =
        typeof result.response.message === "string" &&
        result.response.message.trim()
          ? result.response.message.trim().slice(0, 500)
          : "Data dihapus.";
      if (result.synchronizationFailed)
        toast.warning(
          message +
            " Penghapusan terkonfirmasi, tetapi sinkronisasi tampilan gagal.",
        );
      else toast.success(message);
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context)) return;
      if (error instanceof ParameterUncertainError) {
        setUncertain(error.message);
        setTarget(undefined);
      } else toast.error(parameterRequestErrors(error).root);
    } finally {
      running.current = false;
    }
  };
  const retryRead = async () => {
    if (checking || running.current) return;
    const context = captureSession();
    running.current = true;
    setChecking(true);
    try {
      await query.refetch({ throwOnError: true });
      if (mounted.current && isCurrentSession(context))
        setUncertain(
          "Daftar terkini berhasil dibaca; respons DELETE sebelumnya tetap belum terkonfirmasi. Periksa dengan administrator sebelum mengulang.",
        );
    } catch {
      if (mounted.current && isCurrentSession(context))
        setUncertain("Pemeriksaan gagal. Ini bukan bukti penghapusan gagal.");
    } finally {
      running.current = false;
      if (mounted.current && isCurrentSession(context)) setChecking(false);
    }
  };
  return (
    <ParameterReadBoundary
      data={query.data}
      error={query.error}
      fetching={query.isFetching}
      retry={() => {
        void query.refetch();
      }}
    >
      {uncertain && (
        <div role="alert" className="space-y-2 rounded-md border p-3">
          <p>{uncertain}</p>
          <Button
            variant="outline"
            disabled={checking}
            onClick={() => {
              void retryRead();
            }}
          >
            Periksa daftar
          </Button>
          <p className="text-sm">
            Delete diblokir selama halaman ini terbuka. Tidak ada penghapusan
            yang diulang otomatis.
          </p>
        </div>
      )}
      <DataTables
        table={table}
        title={parameterLabels[resource]}
        description={description}
        toolbar={
          <DataTablesSearch
            value={table.getState().globalFilter ?? ""}
            onChange={table.setGlobalFilter}
          />
        }
        actions={
          createPath ? (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (canManageParameters())
                  router.push(parameterLink(createPath, surveyId, periodId));
              }}
            >
              Tambah
            </Button>
          ) : undefined
        }
      />
      <ConfirmDialogs
        open={!!target}
        onOpenChange={(open) => {
          if (!open && !running.current) setTarget(undefined);
        }}
        title={"Hapus " + parameterLabels[resource] + "?"}
        description={
          resource === "ranges"
            ? "Rentang scoring dihapus permanen sesuai kontrak backend."
            : "Backend memakai soft delete. Kode/identitas unik tetap dapat tertahan; relasi tidak otomatis dihapus seluruhnya."
        }
        onConfirm={() => {
          void remove();
        }}
        closeOnConfirm={false}
        loading={mutation.isPending}
        confirmText="Hapus"
        loadingText="Menghapus..."
      />
      {detail && (
        <Details
          key={session.id + ":" + resource + ":" + detail}
          resource={resource}
          id={detail}
          onClose={() => setDetail(undefined)}
        />
      )}
    </ParameterReadBoundary>
  );
}
