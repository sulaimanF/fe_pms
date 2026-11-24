"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DataTablesHeader from "@/components/tables/DataTablesHeader";
import DataTablesContent from "@/components/tables/DataTablesContent";
import DataTablesPagination from "@/components/tables/DataTablesPagination";
import DataTablesLoading from "@/components/tables/DataTablesLoading";
import DataTablesActions from "@/components/tables/DataTablesActions";
import { useDataTable } from "@/hooks/useDataTable";
import { usePeople } from "@/hooks/usePeople";
import { isForbidden } from "@/lib/authorization";
import { PEOPLE_API_AVAILABLE } from "@/services/people.services";
import type { PeopleViewModel } from "@/types/people";
import DataTablesSearch from "@/components/tables/DataTablesSearch";
import PeopleAdDialog from "./PeopleAdDialog";
import PeopleStatusDialog from "./PeopleStatusDialog";

export default function PeopleList() {
  const query = usePeople();
  const [adOpen, setAdOpen] = useState(false),
    [statusPerson, setStatusPerson] = useState<PeopleViewModel>();
  const data = useMemo(
    () => !isForbidden(query.error) ? (query.data ?? []) : [],
    [query.data, query.error],
  );
  const columns = useMemo<ColumnDef<PeopleViewModel>[]>(
    () => [
      { id: "name", header: "Nama", accessorFn: (row) => row.name },
      { id: "nip", header: "NIP", accessorFn: (row) => row.nip ?? "—" },
      {
        id: "position",
        header: "Jabatan",
        accessorFn: (row) => row.position ?? "—",
      },
      { accessorKey: "jobTitle", header: "Job Title" },
      { accessorKey: "outletName", header: "Lokasi Outlet" },
      { accessorKey: "outletCode", header: "Kode Outlet" },
      {
        id: "region",
        header: "Kanwil",
        accessorFn: (row) => row.regionName ?? "Belum dapat ditentukan",
      },
      { accessorKey: "source", header: "Source" },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => (row.active ? "Active" : "Inactive"),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <DataTablesActions
              row={row.original}
              variant="inline"
              editHref={`/peopleManagement/update/${encodeURIComponent(row.original.id)}`}
              onView={(person) => {
                window.location.assign(
                  `/peopleManagement/${encodeURIComponent(person.id)}`,
                );
              }}
            />
            <Button
              variant="outline"
              onClick={() => setStatusPerson(row.original)}
            >
              {row.original.active ? "Inactive" : "Active"}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );
  const { table, globalFilter, setGlobalFilter } = useDataTable({ data, columns });
  // Row identity is People ID; sorting/filtering never substitutes the row index/name.
  table.setOptions((previous) => ({ ...previous, getRowId: (row) => row.id }));
  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
        <DataTablesHeader
          title="People Management"
          description="Manage people data"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setAdOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add from User AD
              </Button>
              <Button
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link href="/peopleManagement/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manually
                </Link>
              </Button>
            </div>
          }
        />
        <div className="flex w-full items-center justify-end">
          <DataTablesSearch
            value={globalFilter}
            onChange={(value) => {
              setGlobalFilter(value);
              table.setPageIndex(0);
            }}
            placeholder="Search people..."
          />
        </div>
        {query.error && (
          <div role="alert">
            Pemuatan People gagal; data tidak dianggap kosong.{" "}
            {PEOPLE_API_AVAILABLE && (
              <Button onClick={() => void query.refetch()}>Coba lagi</Button>
            )}
          </div>
        )}
        {PEOPLE_API_AVAILABLE && query.isPending ? (
          <DataTablesLoading columns={columns.length} />
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="whitespace-nowrap bg-blue-600 text-white"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {PEOPLE_API_AVAILABLE
                      ? "Tidak ada People yang sesuai pencarian."
                      : "Data People belum dapat dimuat karena API belum tersedia."}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <DataTablesContent
            table={table}
            headerClassName="bg-blue-600 text-white"
          />
        )}
        {data.length > 0 && <DataTablesPagination table={table} />}
      </div>
      {adOpen && <PeopleAdDialog onClose={() => setAdOpen(false)} />}
      {statusPerson && (
        <PeopleStatusDialog
          person={statusPerson}
          onClose={() => setStatusPerson(undefined)}
        />
      )}
    </div>
  );
}
