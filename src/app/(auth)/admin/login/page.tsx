
"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { getUserProfile } from "@/lib/firebase/users";

// Hardcoded admin credentials for simulation
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // Simulate network delay
    setTimeout(async () => {
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password.",
        });
        setLoading(false);
        return;
      }

      try {
        const mockUserId = `sim-admin`; // Corrected User ID
        const userProfile = await getUserProfile(mockUserId);
        
        if (!userProfile || userProfile.userType !== 'admin') {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You do not have administrative privileges."
            });
            setLoading(false);
            return;
        }

        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        toast({
            title: `Welcome, ${userProfile.name}!`,
            description: "You have successfully logged in as an administrator.",
        });

        router.push("/admin/dashboard");
      } catch (error) {
        console.error("Admin login error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred during login.",
        });
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <Card className="w-full max-w-sm animate-card-flip-in bg-blue-100/80 backdrop-blur-sm border-blue-200/50 dark:bg-blue-900/80 dark:border-blue-800/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline text-foreground">Admin Login</CardTitle>
        <CardDescription className="text-foreground">
          Enter your administrator credentials to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="admin123"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Verifying..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
