"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@soundsgood/auth/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
} from "@soundsgood/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log("🔐 LOGIN ATTEMPT:", {
      email,
      timestamp: new Date().toISOString(),
      baseURL: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    });

    try {
      console.log("📤 Sending sign-in request...");
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      console.log("📥 Sign-in response:", {
        hasError: !!result.error,
        errorMessage: result.error?.message,
        data: result.data,
      });

      if (result.error) {
        console.error("❌ Login failed:", result.error);
        setError(result.error.message || "Invalid email or password.");
        return;
      }

      console.log("✅ Login successful, redirecting to dashboard...");
      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("❌ Login exception:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    console.log("🎭 DEMO LOGIN: Auto-filling Vetted Trainers credentials...");
    setEmail("client@vettedtrainers.com");
    setPassword("client123");
    
    // Wait for state to update, then submit
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        console.log("🎭 DEMO LOGIN: Submitting form...");
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            SG
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to access your client portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo Login Button */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Quick Demo
                </span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              🎭 Demo Login (Vetted Trainers)
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Auto-fill credentials for testing
            </p>
          </div>
          
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

