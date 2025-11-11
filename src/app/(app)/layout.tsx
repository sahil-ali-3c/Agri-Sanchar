
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
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/firebase/provider";
import { Spinner } from "@/components/ui/spinner";
import { FirebaseClientProvider } from "@/firebase/client-provider";


function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Exclude join page from profile completion check
    const isJoinPage = pathname.startsWith('/community/join');
    if (isJoinPage) {
        setIsChecking(false);
        return;
    }

    const savedProfile = localStorage.getItem("userProfile");
    let isProfileComplete = false;

    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        if (profile.state && profile.city) {
          isProfileComplete = true;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    if (!isProfileComplete && pathname !== "/profile") {
      router.replace("/profile");
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Spinner className="h-8 w-8" />
        </div>
    );
  }


  return <>{children}</>;
}


function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace(`/login?redirect=${pathname}`);
    }
  }, [isUserLoading, user, router, pathname]);

  if (isUserLoading || !user) {
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
            <ProfileCompletionGuard>
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
            </ProfileCompletionGuard>
        </AuthGuard>
        </NotificationProvider>
    </FirebaseClientProvider>
  );
}
