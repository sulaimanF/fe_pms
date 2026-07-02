"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
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
            M. Rafly Rivaldi
          </span>
        </div>

        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 gap-4"
        >
          Logout
          <LogOut className="ml-2 h-4 w-4"/>
        </Button>

      </div>
    </header>
  )

}