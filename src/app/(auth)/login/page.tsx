
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
import { getUserProfile } from "@/lib/firebase/users";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { useAuth } from "@/firebase/provider";


const addWelcomeNotification = (name: string, lang: 'English' | 'Hindi') => {
    const welcomeMessage = lang === 'Hindi' ? `वापसी पर स्वागत है, ${name}!` : `Welcome back, ${name}!`;
    const description = lang === 'Hindi' ? " आपने कृषि-संचार में सफलतापूर्वक लॉग इन कर लिया है।" : "You have successfully logged in to Agri-Sanchar.";
    
    const newNotification = {
        id: Date.now().toString(),
        title: welcomeMessage,
        description: description,
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

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const { t, language, isLoaded } = useTranslation();

   useEffect(() => {
    if (auth) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, [auth]);
  
  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || !auth) return;
    setLoading(true);

    try {
      const phoneNumber = `+91${phone}`;
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      
      setConfirmationResult(result);
      setOtpSent(true);
      toast({
        title: t.login.otpSentTitle,
        description: "A real OTP has been sent to your phone.",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        variant: "destructive",
        title: "OTP Send Failed",
        description: "Could not send OTP. Please check the phone number or try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || !confirmationResult) return;
    setLoading(true);

    try {
      const credential = await confirmationResult.confirm(otp);
      const user = credential.user;

      const userProfile = await getUserProfile(user.uid);
        
      if (!userProfile) {
          toast({
              variant: "destructive",
              title: t.login.loginFailedTitle,
              description: t.login.loginFailedDesc
          });
          setLoading(false);
          router.push('/signup');
          return;
      }

      userProfile.language = language;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));

      addWelcomeNotification(userProfile.name, language);

      toast({
          title: t.login.loginSuccess,
          description: t.login.welcomeBack(userProfile.name),
      });

      const redirectUrl = searchParams.redirect;

      if (redirectUrl && typeof redirectUrl === 'string') {
          router.push(redirectUrl);
      } else if (userProfile.state && userProfile.city) {
          router.push("/dashboard");
      } else {
          router.push("/profile");
      }
    } catch (error) {
        console.error("Login error:", error);
        toast({
          variant: "destructive",
          title: t.login.invalidOtpTitle,
          description: "The OTP you entered is incorrect or has expired.",
        });
        setLoading(false);
    }
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
       <div id="recaptcha-container"></div>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline text-foreground">{t.login.title}</CardTitle>
        <CardDescription className="text-foreground">
          {otpSent ? (
            t.login.enterOtp
          ) : (
            <>
              <p>{t.login.enterPhone}</p>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-foreground text-left">{t.login.phoneLabel}</Label>
              <div className="flex items-center gap-2">
                <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
                  +91
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t.login.phonePlaceholder}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || phone.length < 10}>
              {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t.login.sendingOtp : t.login.sendOtp}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp" className="text-foreground text-left">{t.login.otpLabel}</Label>
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
              {loading ? t.login.verifying : t.login.verifyAndLogin}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm text-foreground">
          {t.login.noAccount}{" "}
          <Link href="/signup" className="underline text-primary font-semibold">
            {t.login.signUp}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
