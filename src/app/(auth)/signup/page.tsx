
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/hooks/use-translation";
import { setUserProfile, type UserProfile } from "@/lib/firebase/users";

const addWelcomeNotification = (name: string, lang: 'English' | 'Hindi') => {
    const newNotification = {
        id: Date.now().toString(),
        title: lang === 'Hindi' ? `स्वागत है, ${name}!` : `Welcome, ${name}!`,
        description: lang === 'Hindi' ? "आपका कृषि-संचार खाता सफलतापूर्वक बना दिया गया है।" : "Your Agri-Sanchar account has been created successfully.",
        read: false,
        timestamp: Date.now(),
    };
    try {
        const storedNotifications = localStorage.getItem("notifications");
        const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
        localStorage.setItem("notifications", JSON.stringify([newNotification, ...notifications]));
    } catch (error) {
        console.error("Failed to add notification to localStorage", error);
    }
};

const generateId = () => {
    const part1 = Math.floor(1000 + Math.random() * 9000).toString();
    const part2 = Math.floor(1000 + Math.random() * 9000).toString();
    return `AS-${part1}-${part2}`;
};


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { t, language, setLanguage, isLoaded } = useTranslation();

  useEffect(() => {
    if (isLoaded) {
      const lang = localStorage.getItem('selectedLanguage');
      if (lang === 'Hindi') {
          setLanguage('Hindi');
      } else {
          setLanguage('English');
      }
    }
  }, [isLoaded, setLanguage]);

  const handleSendOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      toast({
        title: t.signup.otpSentTitle,
        description: t.signup.otpSentDesc,
      });
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    setTimeout(async () => {
        if (otp === "123456") {
            try {
                const farmerId = generateId();
                const mockUserId = `sim-${phone}`; // Simulated ID for localStorage key

                const userProfile: UserProfile = {
                    farmerId: farmerId,
                    name: name,
                    phone: `+91${phone}`,
                    avatar: `https://picsum.photos/seed/${farmerId}/100/100`,
                    farmSize: "",
                    city: "",
                    state: "",
                    annualIncome: "",
                    language: language,
                    age: "",
                    dob: "",
                    gender: "",
                    userType: 'farmer',
                };
                
                await setUserProfile(mockUserId, userProfile);
                localStorage.setItem("userProfile", JSON.stringify(userProfile));
                
                addWelcomeNotification(userProfile.name, language);

                toast({
                    title: t.signup.welcomeTitle(name),
                    description: t.signup.welcomeDesc,
                });
                router.push("/profile");
            
            } catch (error) {
                console.error("Signup error:", error);
                toast({
                    variant: "destructive",
                    title: t.signup.signupFailedTitle,
                    description: t.signup.signupFailedDesc,
                });
                setLoading(false);
            }
        } else {
            toast({
                variant: "destructive",
                title: t.signup.invalidOtpTitle,
                description: t.signup.invalidOtpDesc,
            });
            setLoading(false);
        }
    }, 1000);
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm animate-card-flip-in bg-green-100/80 backdrop-blur-sm border-green-200/50 dark:bg-green-900/80 dark:border-green-800/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">{t.signup.title}</CardTitle>
        <CardDescription className="text-foreground">
          {otpSent ? t.signup.enterOtp : t.signup.createAccount}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground text-left">{t.signup.nameLabel}</Label>
              <Input
                id="name"
                placeholder={t.signup.namePlaceholder}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-foreground text-left">{t.signup.phoneLabel}</Label>
              <div className="flex items-center gap-2">
                <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
                  +91
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t.signup.phonePlaceholder}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || phone.length < 10 || name.length === 0}>
              {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t.signup.sendingOtp : t.signup.sendOtp}
            </Button>
          </form>
        ) : (
           <form onSubmit={handleVerifyOtp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp" className="text-foreground text-left">{t.signup.otpLabel}</Label>
              <Input
                id="otp"
                type="tel"
                placeholder="Enter 6-digit OTP"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                disabled={loading}
                className="tracking-widest text-center"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
              {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t.signup.verifying : t.signup.verifyAndCreate}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm text-foreground">
          {t.signup.haveAccount}{" "}
          <Link href="/login" className="underline text-primary font-semibold">
            {t.signup.login}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
