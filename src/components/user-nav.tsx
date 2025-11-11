
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Languages, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/firebase/provider";

type UserProfile = {
  name: string;
  phone: string;
  avatar: string;
  language?: 'English' | 'Hindi';
}

export function UserNav() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { t, setLanguage } = useTranslation();

  const updateUserProfile = () => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }

  useEffect(() => {
    updateUserProfile();

    // Listen for the custom event to update the profile
    window.addEventListener("storage", updateUserProfile);

    return () => {
        window.removeEventListener("storage", updateUserProfile);
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    if (userProfile && (lang === 'English' || lang === 'Hindi')) {
      const updatedProfile = { ...userProfile, language: lang };
      setUserProfile(updatedProfile);
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      setLanguage(lang);
      
      toast({
        title: t.userNav.languageUpdated,
        description: t.userNav.languageUpdatedDesc(lang),
      });
      // A full reload is necessary for some deep components to pick up the new language context
       window.location.reload();
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("userProfile");
      localStorage.removeItem("selectedLanguage");
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      // Optionally, show a toast message to the user
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={userProfile?.avatar || "https://picsum.photos/seed/farm-icon/40/40"}
              alt="@farmer"
              data-ai-hint="farm icon"
            />
            <AvatarFallback>{userProfile ? userProfile.name.substring(0, 2) : "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile?.name || "Farmer"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userProfile?.phone || ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>{t.userNav.profile}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="mr-2 h-4 w-4" />
              <span>{t.userNav.language}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                 <DropdownMenuRadioGroup value={userProfile?.language || 'English'} onValueChange={handleLanguageChange}>
                    <DropdownMenuRadioItem value="English">English</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Hindi">हिन्दी</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.userNav.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
