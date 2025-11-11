
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  AreaChart,
  Users,
  LogOut,
  Home,
  FileText,
  Settings,
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem("userProfile");
    router.push("/admin/login");
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: AreaChart },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold font-headline">
          <Leaf className="h-6 w-6 text-primary" />
          <span>Agri-Sanchar Admin</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                pathname.startsWith(link.href) ? "bg-muted text-primary" : ""
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button size="sm" className="w-full" onClick={handleLogout} variant="outline">
           <LogOut className="mr-2 h-4 w-4" />
           Logout
        </Button>
      </div>
    </div>
  );
}
