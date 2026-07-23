"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  open: boolean;
  text?: string;
}

export default function LoadingOverlay({
  open,
  text = "Loading...",
}: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-xl bg-white px-8 py-6 shadow-xl flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

        <p className="text-sm font-medium text-gray-700">
          {text}
        </p>
      </div>
    </div>
  );
}