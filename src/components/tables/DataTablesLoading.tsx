"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { DataTablesLoadingProps } from "./types";

export default function DataTablesLoading({
  rows = 5,
  columns = 1,
}: DataTablesLoadingProps) {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-8 w-full"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}