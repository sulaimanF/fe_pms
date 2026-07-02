"use client";

import { ReactNode } from "react";

interface DataTablesHeaderProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export default function DataTablesHeader({
  title,
  description,
  actions,
}: DataTablesHeaderProps) {
  // Jika tidak ada apa-apa, tidak perlu render
  if (!title && !description && !actions) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left */}
      <div className="space-y-1">
        {title && (
          <h2 className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
        )}

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Right */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}