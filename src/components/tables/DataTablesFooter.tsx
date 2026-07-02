"use client";

import type { DataTablesFooterProps } from "./types";

export default function DataTablesFooter({
  footer,
  children,
}: DataTablesFooterProps) {
  // Tidak render jika footer dan pagination kosong
  if (!footer && !children) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
      {/* Left Content */}
      <div className="text-sm text-muted-foreground">
        {footer}
      </div>

      {/* Right Content */}
      <div>
        {children}
      </div>
    </div>
  );
}