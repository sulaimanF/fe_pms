"use client";
import { AccessGuard } from "@/components/auth/AccessGuard";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSessionQuery } from "@/hooks/useAuth";
export default function PeopleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSessionQuery();
  return (
    <AccessGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main key={session.id} className="p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AccessGuard>
  );
}
