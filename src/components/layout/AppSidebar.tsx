"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Bell, ClipboardCheck, Shield, Building2, Landmark, LayoutGrid, FileEdit, Clipboard, User, Contact, Award } from "lucide-react";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

type NavLink = {
    icon: React.ElementType;
    name: string;
    path: string;
};

type NavSection = {
    title: string;
    items: NavLink[];
};

const navItems: NavSection[] = [
  {
    title: "",
    items: [
      { icon: LayoutGrid, name: "Home", path: "/dashboard" },
      { icon: Bell, name: "Notification", path: "/notification" },
      { icon: Shield, name: "Audit Trail", path: "/auditTrail" },
      { icon: Landmark, name: "Outlet", path: "/outlet" },
    ],
  },
  {
    title: "Kuesioner",
    items: [
      { icon: FileEdit, name: "Kuesioner", path: "/kuesioner" },
      { icon: Clipboard, name: "Response", path: "/response" },
      { icon: ClipboardCheck, name: "Review Kuesioner", path: "/review" },
    ],
  },
  {
    title: "Master Data",
    items: [
      { icon: User, name: "User Management", path: "/userManagement" },
      { icon: Contact, name: "Role Management", path: "/roleManagement" },
      { icon: Building2, name: "Outlet Management", path: "/outletManagement" },
      { icon: Award, name: "Parameter Penilaian", path: "/parameterPenilaian" },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('token');
      router.replace('/login');
    }
  }

  return (
    <Sidebar
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="py-6">
        <div className={`
          flex
          items-center
          ${collapsed ? "justify-center" : "justify-start px-4"}
        `}>
          <Image
            src="/images/logo-putih.svg"
            alt="Logo"
            width={collapsed ? 28 : 110}
            height={32}
          />
        </div>

        <div className={`mt-6 flex flex-col items-center ${
          collapsed ? "gap-0" : "gap-2"
        }`}>
          <Avatar className={collapsed ? "h-8 w-8" : "h-16 w-16"}>
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <h3 className="text-sidebar-foreground font-medium">
                M. Rafly Rivaldi
              </h3>

              <p className="text-sidebar-foreground/80 text-sm">
                CXD
              </p>
            </>
          )}
        </div>
      </SidebarHeader>

    {/* Content */}
    <SidebarContent>
      {navItems.map((section, index) => (
          <SidebarGroup
            key={section.title}
            className={collapsed ? "px-2 py-1" : "px-3 py-1"}
          >
            {index > 0 && (
              <Separator className={
                collapsed
                  ? "mx-2 my-2 bg-white/50"
                  : "my-2 bg-white/50"
              }/>
            )}
            {section.title && (
              <SidebarGroupLabel
                className="uppercase text-sidebar-foreground/70"
              >
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={collapsed ? "space-y-1" : "space-y-2"}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem
                      key={item.path}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.path}
                        tooltip={collapsed ? item.name : undefined}
                        className={`
                          text-[15px]
                          font-medium
                          hover:bg-sidebar-accent
                          hover:text-sidebar-accent-foreground
                          data-[active=true]:bg-white
                          data-[active=true]:text-[#0D5EF4]
                          ${
                            collapsed
                              ? "mx-auto rounded-lg"
                              : "h-10"
                          }
                        `}
                      >
                        <Link
                          href={item.path}
                          className={`
                            flex items-center
                            ${collapsed ? "justify-center" : ""}
                          `}
                        >
                          <Icon/>
                          <span className={collapsed ? "hidden" : ""}>
                              {item.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                      
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={collapsed ? "Logout" : undefined}
              className={`
                h-10
                text-[15px]
                font-medium
                hover:bg-sidebar-accent
                ${
                  collapsed
                    ? "mx-auto rounded-lg"
                    : "h-10"
                }
              `}
            >
              <LogOut/>
              <span className={collapsed ? "hidden" : ""}>
                  Logout
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
