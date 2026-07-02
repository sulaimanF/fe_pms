"use client"

import { SidebarProvider } from "@/components/ui/sidebar"

import AppSidebar from "./AppSidebar"
import AppHeader from "./AppHeader"


export default function AppLayout({
    children,
}:{
    children:React.ReactNode
}){
    return(
        <SidebarProvider>
            <AppSidebar/>
            <main className="flex-1">
                <AppHeader/>
                {children}
            </main>
        </SidebarProvider>
    )
}