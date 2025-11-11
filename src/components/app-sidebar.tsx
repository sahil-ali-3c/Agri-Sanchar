
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  CloudSun,
  LayoutDashboard,
  Users,
  User,
  TrendingUp,
  FlaskConical,
  Bug,
  Tractor,
  Landmark,
  LogOut,
  Calculator,
} from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/firebase/provider";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("userProfile");
      localStorage.removeItem("selectedLanguage");
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const links = [
    { href: "/dashboard", label: t.sidebar.dashboard, icon: LayoutDashboard },
    { href: "/schemes", label: t.sidebar.schemes, icon: Landmark },
    { href: "/community", label: t.sidebar.community, icon: Users },
    { href: "/market", label: t.sidebar.market, icon: TrendingUp },
    { href: "/soil-testing", label: t.sidebar.soil, icon: FlaskConical },
    { href: "/rental", label: t.sidebar.rental, icon: Tractor },
    { href: "/yield-calculator", label: "Yield Calculator", icon: Calculator },
    { href: "/profile", label: t.sidebar.profile, icon: User },
  ];

  return (
    <>
      <SidebarContent className="pt-8 flex-1">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={link.href !== '#' && pathname.startsWith(link.href)}
                tooltip={link.label}
                className="justify-start"
              >
                <Link href={link.href}>
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
           <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip="Log Out"
                    className="justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Log Out</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
