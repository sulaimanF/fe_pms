"use client";

import type { DataTablesToolbarProps } from "./types";

export default function DataTablesToolbar({
  children,
}: DataTablesToolbarProps) {
  // Tidak render jika tidak ada isi toolbar
  if (!children) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}