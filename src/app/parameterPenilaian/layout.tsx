"use client";
import { Suspense } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { ParameterNavigation } from "@/components/parameter/ParameterNavigation";

export default function ParameterLayout({children}:{children:React.ReactNode}) {
  return <ParameterAccessGuard><SidebarProvider><AppSidebar/><SidebarInset><AppHeader/><main className="p-4 md:p-6">
    <Suspense fallback={<LoadingOverlay open/>}><ParameterNavigation/>{children}</Suspense>
  </main></SidebarInset></SidebarProvider></ParameterAccessGuard>;
}

