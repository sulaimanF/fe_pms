"use client";

import type { DataTablesEmptyProps } from "./types";

export default function DataTablesEmpty({
  title = "No Data Found",
  description = "There is no data available.",
  icon,
  children,
}: DataTablesEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border py-12 text-center">
      {/* Icon */}
      <div className="mb-4 text-5xl">
        {icon ?? "📄"}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>

      {/* Optional Action */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}