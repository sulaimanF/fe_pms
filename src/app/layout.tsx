import type { Metadata } from "next";
import ReduxProvider from "@/store/provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "PMS - Premises Management System",
  // icons: {
  //   icon: "/icon.svg",
  // },
  description: "Premises Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ReduxProvider>
          <TooltipProvider>
            {children}
            <Toaster
              position="top-center"
              richColors
              closeButton
            />
          </TooltipProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
