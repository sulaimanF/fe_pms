"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import LogoutButton from "@/components/ui/logoutButton";

export default function AppHeader() {

  const user = useAppSelector(
    (state) => state.auth.user
  );

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8">
      <SidebarTrigger/>
      <div className="flex items-center gap-5">

        <button className="relative">
          <Bell className="h-5 w-5"/>
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2">
          <User className="h-5 w-5"/>
          <span className="text-sm font-medium">
            {user?.display_name ?? user?.full_name ?? user?.username}
          </span>
        </div>

        <LogoutButton variant="button" />

      </div>
    </header>
  )

}