
"use client";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { NotificationProvider } from "@/context/notification-context";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/firebase/provider";
import { Spinner } from "@/components/ui/spinner";
import { FirebaseClientProvider } from "@/firebase/client-provider";


function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This check only runs on the client side
    if (typeof window !== 'undefined') {
        const savedProfile = localStorage.getItem("userProfile");
        
        // If there's no active user session and no saved profile, redirect to login
        if (!isUserLoading && !user && !savedProfile) {
          router.replace(`/login?redirect=${pathname}`);
        }
    }
  }, [isUserLoading, user, router, pathname]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
        <NotificationProvider>
        <AuthGuard>
            <SidebarProvider>
            <Sidebar collapsible="icon">
                <AppSidebar />
            </Sidebar>
            <div className="md:hidden">
                <BottomNav />
            </div>
            <SidebarInset>
                <AppHeader />
                <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
            </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
        </NotificationProvider>
    </FirebaseClientProvider>
  );
}
