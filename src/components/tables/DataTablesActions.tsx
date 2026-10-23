"use client";

import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTablesActionsProps<TData> {
  row: TData;
  variant?: "dropdown" | "inline";
  editHref?: string;
  unavailable?: boolean;
  onView?: (row: TData) => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
}

export default function DataTablesActions<TData>({
  row,
  variant = "dropdown",
  editHref,
  unavailable = false,
  onView,
  onEdit,
  onDelete,
}: DataTablesActionsProps<TData>) {
  if (unavailable) return <div className="flex items-center gap-1"><Button disabled variant="ghost" size="icon" title="Edit belum tersedia"><Pencil className="h-4 w-4" /></Button><Button disabled variant="ghost" size="icon" title="Delete belum tersedia"><Trash2 className="h-4 w-4" /></Button><span className="text-xs text-gray-500">Belum tersedia</span></div>;

  const inlineActions = (
    <div className="flex items-center gap-1">
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          title="View Detail"
          onClick={() => onView(row)}
        >
          <Eye className="h-4 w-4 text-green-600 hover:text-green-700" />
        </Button>
      )}

      {editHref ? (
        <Button
          asChild
          variant="ghost"
          size="icon"
          title="Edit"
        >
          <Link href={editHref}>
            <Pencil className="h-4 w-4 text-blue-600 hover:text-blue-700" />
          </Link>
        </Button>
      ) : (
        onEdit && (
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={() => onEdit(row)}
          >
            <Pencil className="h-4 w-4 text-blue-600 hover:text-blue-700" />
          </Button>
        )
      )}

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          onClick={() => onDelete(row)}
        >
          <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
        </Button>
      )}
    </div>
  );

  const dropdownActions = (
    <DropdownMenu>

      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">

        {onView && (
          <DropdownMenuItem
            onClick={() => onView(row)}
          >
            <Eye className="mr-2 h-4 w-4 text-green-600" />
            View Detail
          </DropdownMenuItem>
        )}

        {editHref ? (
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil className="mr-2 h-4 w-4 text-blue-600" />
              Edit
            </Link>
          </DropdownMenuItem>
        ) : (
          onEdit && (
            <DropdownMenuItem
              onClick={() => onEdit(row)}
            >
              <Pencil className="mr-2 h-4 w-4 text-blue-600" />
              Edit
            </DropdownMenuItem>
          )
        )}

        {onDelete && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => onDelete(row)}
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-600" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return variant === "inline"
  ? inlineActions
  : dropdownActions;
}
