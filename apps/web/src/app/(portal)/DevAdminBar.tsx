"use client";

import { useState, useEffect } from "react";
import { Settings, Building2 } from "lucide-react";
import { 
  Button, 
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@soundsgood/ui";

// Business type labels for display
const businessTypeLabels: Record<string, string> = {
  fitness: "Fitness / Gym",
  restaurant: "Restaurant / Food",
  retail: "Retail Store",
  professional_services: "Professional Services",
  ecommerce: "E-commerce",
  real_estate: "Real Estate",
  salon_spa: "Salon / Spa",
  healthcare: "Healthcare",
  construction: "Construction / Trades",
  creative_agency: "Creative Agency",
  nonprofit: "Nonprofit",
  education: "Education",
  reiki: "Reiki / Energy Healing",
  other: "Other",
};

export function DevAdminBar() {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRealAdmin, setIsRealAdmin] = useState(false); // Actual admin role from database
  const [isLoading, setIsLoading] = useState(true);
  
  // Business type state
  const [currentBusinessType, setCurrentBusinessType] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [isChangingType, setIsChangingType] = useState(false);

  useEffect(() => {
    // Check if we're on localhost
    const localhost = 
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1";
    setIsLocalhost(localhost);

    // Always check if user is a real admin (from database role)
    checkUserRole();
    
    // Also check dev admin mode status and business types
    checkAdminStatus();
    if (localhost) {
      fetchBusinessType();
    }
  }, []);

  // Check if user has actual admin role in database
  const checkUserRole = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        const userIsAdmin = data.role === "admin";
        setIsRealAdmin(userIsAdmin);
        // If user is a real admin, automatically enable admin mode
        if (userIsAdmin) {
          setIsAdmin(true);
        }
      }
    } catch (err) {
      console.error("Failed to check user role:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/dev/admin-mode");
      if (response.ok) {
        const data = await response.json();
        // Only set from cookie if not already set by real admin status
        if (!isRealAdmin) {
          setIsAdmin(data.isDevAdmin);
        }
      }
    } catch (err) {
      console.error("Failed to check admin status:", err);
    }
  };

  const fetchBusinessType = async () => {
    try {
      const response = await fetch("/api/dev/demo-business-type");
      if (response.ok) {
        const data = await response.json();
        setCurrentBusinessType(data.currentType);
        setAvailableTypes(data.availableTypes || []);
      }
    } catch (err) {
      console.error("Failed to fetch business type:", err);
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

  const handleBusinessTypeChange = async (newType: string) => {
    setIsChangingType(true);
    try {
      const response = await fetch("/api/dev/demo-business-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: newType }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentBusinessType(data.organization.businessType);
        // Dispatch custom event so other components can react
        window.dispatchEvent(new CustomEvent("demo-business-type-changed", { 
          detail: { 
            businessType: data.organization.businessType,
            photoTags: data.organization.photoTags,
          } 
        }));
      }
    } catch (err) {
      console.error("Failed to change business type:", err);
    } finally {
      setIsChangingType(false);
    }
  };

  // Show dev tools if:
  // 1. User is a real admin (always, regardless of localhost)
  // 2. On localhost (for any user)
  const shouldShowDevTools = isRealAdmin || isLocalhost;

  // Don't render anything if shouldn't show or still loading
  if (!shouldShowDevTools || isLoading) {
    return null;
  }

  return (
    <div className="bg-orange-100 border-b border-orange-200 px-4 py-2">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto gap-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-900">Dev Tools</span>
          {isRealAdmin ? (
            <Badge variant="outline" className="text-[10px] border-green-400 text-green-700 bg-green-50">
              Admin Account
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">
              localhost only
            </Badge>
          )}
          {isAdmin && (
            <span className="text-xs text-orange-700 ml-2">
              • Admin mode active — you can edit deliverables
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Business Type Switcher */}
          {availableTypes.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-600" />
              <Select
                value={currentBusinessType || ""}
                onValueChange={handleBusinessTypeChange}
                disabled={isChangingType}
              >
                <SelectTrigger className="h-7 w-[180px] text-xs bg-white">
                  <SelectValue placeholder="Demo Business Type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {businessTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Admin Mode Toggle */}
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
    </div>
  );
}
