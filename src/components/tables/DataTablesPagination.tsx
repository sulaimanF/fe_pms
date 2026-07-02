"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import type {
  DataTablesPaginationProps,
} from "./types";

export default function DataTablesPagination<TData>({
  table,
}: DataTablesPaginationProps<TData>) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
      {/* Rows Per Page */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Rows per page
        </span>

        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="10">
              10
            </SelectItem>

            <SelectItem value="20">
              20
            </SelectItem>

            <SelectItem value="50">
              50
            </SelectItem>

            <SelectItem value="100">
              100
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Page Info */}
      <div className="text-sm text-muted-foreground">
        Page{" "}
        <span className="font-medium text-foreground">
          {table.getState().pagination.pageIndex + 1}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {table.getPageCount()}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}