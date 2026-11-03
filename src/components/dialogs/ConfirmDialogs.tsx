"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react"

interface ConfirmDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  closeOnConfirm?: boolean;
}

export default function ConfirmDialogs({
  open,
  onOpenChange,
  title = "Konfirmasi",
  description = "Apakah Anda yakin?",
  onConfirm,
  loading,
  confirmText = "Delete",
  cancelText = "Cancel",
  loadingText = "Deleting...",
  closeOnConfirm = true,
}: ConfirmDialogsProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={!closeOnConfirm && loading}>
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(event) => {
              if (!closeOnConfirm) event.preventDefault();
              onConfirm();
            }}
            disabled={loading}
          >
            {loading ? loadingText : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
