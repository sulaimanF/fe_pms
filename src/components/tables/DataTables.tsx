"use client";

import {
  DataTablesContent,
  DataTablesEmpty,
  DataTablesFooter,
  DataTablesHeader,
  DataTablesLoading,
  DataTablesPagination,
  DataTablesToolbar,
} from ".";

import type { DataTableProps } from "./types";

export default function DataTables<TData>({
  table,
  title,
  description,

  loading = false,

  toolbar,

  actions,

  footer,

  pagination = true,

  headerClassName,
}: DataTableProps<TData>) {
  return (
    <div className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
      {/* Header */}
      <DataTablesHeader
        title={title}
        description={description}
        actions={actions}
      />

      {/* Toolbar */}
      <DataTablesToolbar>{toolbar}</DataTablesToolbar>

      {/* Loading */}
      {loading ? (
        <DataTablesLoading columns={table.getVisibleLeafColumns().length} />
      ) : table.getRowModel().rows.length === 0 ? (
        <DataTablesEmpty />
      ) : (
        <DataTablesContent table={table} headerClassName={headerClassName} />
      )}

      {/* Footer */}
      <DataTablesFooter footer={footer}>
        {pagination && <DataTablesPagination table={table} />}
      </DataTablesFooter>
    </div>
  );
}
