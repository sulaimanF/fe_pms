"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ConfirmDialogsLogout from "@/components/dialogs/ConfirmDiloagsLogout";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

interface LogoutButtonProps {
  variant?: "button" | "menu";
  children?: React.ReactNode;
}

export default function LogoutButton({
  variant = "button",
}: LogoutButtonProps) {
  const logoutMutation = useLogout();

  const [openLogoutDialog, setOpenLogoutDialog] =
    useState(false);

  const loggingOut = logoutMutation.isPending;

  const confirmLogout = () => {
    if (loggingOut) return;
    setOpenLogoutDialog(false);
    logoutMutation.mutate();
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          size="sm"
          disabled={loggingOut}
          onClick={() => { if (!loggingOut) setOpenLogoutDialog(true); }}
          className="gap-4 bg-red-600 hover:bg-red-700"
        >
          Logout
          <LogOut className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-disabled={loggingOut}
          onClick={() => { if (!loggingOut) setOpenLogoutDialog(true); }}
          className="flex w-full items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </div>
      )}

      <ConfirmDialogsLogout
        open={openLogoutDialog}
        onOpenChange={setOpenLogoutDialog}
        title="Logout"
        description="Are you sure you want to logout from this account?"
        onConfirm={confirmLogout}
        loading={loggingOut}
      />

      <LoadingOverlay
        open={loggingOut}
        text="Logging out..."
      />
    </>
  );
}
