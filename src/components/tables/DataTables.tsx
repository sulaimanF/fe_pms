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
      <DataTablesToolbar>
        {toolbar}
      </DataTablesToolbar>

      {/* Loading */}
      {loading ? (
        <DataTablesLoading columns={table.getVisibleLeafColumns().length} />
      ) : table.getRowModel().rows.length === 0 ? (
        <DataTablesEmpty />
      ) : (
        <DataTablesContent
          table={table}
          headerClassName={headerClassName}
        />
      )}

      {/* Footer */}
      <DataTablesFooter footer={footer}>
        {pagination && <DataTablesPagination table={table} />}
      </DataTablesFooter>

    </div>
  );
}

// "use client";

// import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";

// type DataTableProps<TData, TValue> = {
//   columns: ColumnDef<TData, TValue>[];
//   data: TData[];
// };

// export function DataTable<TData, TValue>({
//   columns,
//   data,
// }: DataTableProps<TData, TValue>) {
//   const table = useReactTable({
//     data,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//   });

//   return (
//     <div className="overflow-hidden rounded border border-gray-300 bg-white">
//       <div className="max-h-[600px] overflow-auto">
//         <table className="w-full border-collapse text-[13px]">
//           <thead className="sticky top-0 bg-[#f3f3f3] z-10">
//             {table.getHeaderGroups().map((headerGroup) => (
//               <tr
//                 key={headerGroup.id}
//                 className="border-b border-gray-700"
//               >
//                 {headerGroup.headers.map((header) => (
//                   <th
//                     key={header.id}
//                     className="px-4 py-3 text-left font-bold text-black whitespace-nowrap"
//                   >
//                     {flexRender(
//                       header.column.columnDef.header,
//                       header.getContext()
//                     )}
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>

//           <tbody>
//             {table.getRowModel().rows.map((row) => (
//               <tr
//                 key={row.id}
//                 className="border-b border-gray-300 hover:bg-gray-50"
//               >
//                 {row.getVisibleCells().map((cell) => (
//                   <td
//                     key={cell.id}
//                     className="px-4 py-3 whitespace-nowrap text-gray-800"
//                   >
//                     {flexRender(
//                       cell.column.columnDef.cell,
//                       cell.getContext()
//                     )}
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }