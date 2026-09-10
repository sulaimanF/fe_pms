"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import api from "@/lib/axios";
import { logout } from "@/store/slices/authSlice";
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
  const router = useRouter();
  const dispatch = useDispatch();

  const [openLogoutDialog, setOpenLogoutDialog] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const confirmLogout = async () => {
    setOpenLogoutDialog(false);
    setLoggingOut(true);

    try {
      await api.post("/auth/logout");

      dispatch(logout());

      localStorage.removeItem("token");
      localStorage.removeItem("token_type");

      router.replace("/login");
    } catch (err) {
      console.error(err);

      setLoggingOut(false);
    }
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          size="sm"
          onClick={() => setOpenLogoutDialog(true)}
          className="gap-4 bg-red-600 hover:bg-red-700"
        >
          Logout
          <LogOut className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpenLogoutDialog(true)}
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