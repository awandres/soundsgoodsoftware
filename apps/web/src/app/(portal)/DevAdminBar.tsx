"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button, Badge } from "@soundsgood/ui";

export function DevAdminBar() {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're on localhost
    const localhost = 
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1";
    setIsLocalhost(localhost);

    if (localhost) {
      checkAdminStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/dev/admin-mode");
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isDevAdmin);
      }
    } catch (err) {
      console.error("Failed to check admin status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDevAdminMode = async () => {
    try {
      const response = await fetch("/api/dev/admin-mode", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        setIsAdmin(data.isDevAdmin);
        // Dispatch custom event so other components can react
        window.dispatchEvent(new CustomEvent("dev-admin-mode-changed", { 
          detail: { isAdmin: data.isDevAdmin } 
        }));
      }
    } catch (err) {
      console.error("Failed to toggle dev admin mode:", err);
    }
  };

  // Don't render anything if not localhost or still loading
  if (!isLocalhost || isLoading) {
    return null;
  }

  return (
    <div className="bg-orange-100 border-b border-orange-200 px-4 py-2">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-900">Dev Tools</span>
          <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">
            localhost only
          </Badge>
          {isAdmin && (
            <span className="text-xs text-orange-700 ml-2">
              • Admin mode active — you can edit deliverables
            </span>
          )}
        </div>
        <Button
          variant={isAdmin ? "default" : "outline"}
          size="sm"
          onClick={toggleDevAdminMode}
          className={isAdmin ? "bg-green-600 hover:bg-green-700 h-7 text-xs" : "h-7 text-xs"}
        >
          {isAdmin ? "✓ Admin Mode ON" : "Enable Admin Mode"}
        </Button>
      </div>
    </div>
  );
}

