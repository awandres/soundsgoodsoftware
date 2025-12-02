"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, Spinner } from "@soundsgood/ui";
import { signOut } from "@soundsgood/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      className="mt-2 w-full justify-start gap-2"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {isLoading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}

