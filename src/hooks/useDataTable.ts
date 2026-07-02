"use client";

import * as React from "react";

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  PaginationState,
  RowSelectionState,
  ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface UseDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];

  initialPageSize?: number;
}

export function useDataTable<TData>({
  data,
  columns,
  initialPageSize = 10,
}: UseDataTableProps<TData>) {
  const [sorting, setSorting] =
    React.useState<SortingState>([]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);

  const [globalFilter, setGlobalFilter] =
    React.useState("");

  const [rowSelection, setRowSelection] =
    React.useState<RowSelectionState>({});

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const [pagination, setPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: initialPageSize,
    });

  const table = useReactTable({
    data,
    columns,

    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      pagination,
    },

    onSortingChange: setSorting,

    onColumnFiltersChange: setColumnFilters,

    onGlobalFilterChange: setGlobalFilter,

    onRowSelectionChange: setRowSelection,

    onColumnVisibilityChange:
      setColumnVisibility,

    onPaginationChange: setPagination,

    getCoreRowModel:
      getCoreRowModel(),

    getSortedRowModel:
      getSortedRowModel(),

    getFilteredRowModel:
      getFilteredRowModel(),

    getPaginationRowModel:
      getPaginationRowModel(),

    enableRowSelection: true,
  });

  return {
    table,

    sorting,
    setSorting,

    columnFilters,
    setColumnFilters,

    globalFilter,
    setGlobalFilter,

    rowSelection,
    setRowSelection,

    columnVisibility,
    setColumnVisibility,

    pagination,
    setPagination,
  };
}