
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // This check only runs on the client side
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem("userProfile");
      let isAdmin = false;

      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          if (profile.userType === 'admin') {
            isAdmin = true;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // If user is not an admin and not on the admin login page, redirect them.
      if (!isAdmin && pathname !== "/admin/login") {
        router.replace("/admin/login");
      } else {
        setIsChecking(false);
      }
      
      // If user is an admin but on the login page, redirect to dashboard.
      if (isAdmin && pathname === "/admin/login") {
        router.replace("/admin/dashboard");
      }
    }
  }, [pathname, router]);

  if (isChecking) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Spinner className="h-8 w-8" />
          </div>
      );
  }

  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/admin/login') {
    return <AdminAuthGuard>{children}</AdminAuthGuard>
  }
  
  return (
    <AdminAuthGuard>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
            <AdminSidebar />
        </div>
        <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                        >
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0">
                        <AdminSidebar />
                    </SheetContent>
                </Sheet>
            </header>
            <main className="flex-1 bg-muted/40">{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
