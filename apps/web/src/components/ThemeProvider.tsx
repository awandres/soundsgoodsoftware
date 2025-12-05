"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Brand colors interface
interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

// Organization theme data
interface OrgTheme {
  brandColors?: BrandColors;
  logoUrl?: string;
  organizationName?: string;
}

interface ThemeContextValue {
  theme: OrgTheme | null;
  setTheme: (theme: OrgTheme | null) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  setTheme: () => {},
  isLoading: true,
});

// Default brand colors (matches the app's default purple theme)
const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: "#667eea",
  secondary: "#764ba2",
  accent: "#f59e0b",
};

/**
 * Convert hex to HSL values
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace("#", "");
  
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Apply brand colors as CSS custom properties
 */
function applyBrandColors(colors: BrandColors) {
  const root = document.documentElement;
  
  // Primary color
  if (colors.primary) {
    const hsl = hexToHSL(colors.primary);
    if (hsl) {
      root.style.setProperty("--brand-primary", colors.primary);
      root.style.setProperty("--brand-primary-h", `${hsl.h}`);
      root.style.setProperty("--brand-primary-s", `${hsl.s}%`);
      root.style.setProperty("--brand-primary-l", `${hsl.l}%`);
      // Also set the primary color for shadcn components
      root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  }
  
  // Secondary color
  if (colors.secondary) {
    const hsl = hexToHSL(colors.secondary);
    if (hsl) {
      root.style.setProperty("--brand-secondary", colors.secondary);
      root.style.setProperty("--brand-secondary-h", `${hsl.h}`);
      root.style.setProperty("--brand-secondary-s", `${hsl.s}%`);
      root.style.setProperty("--brand-secondary-l", `${hsl.l}%`);
    }
  }
  
  // Accent color
  if (colors.accent) {
    const hsl = hexToHSL(colors.accent);
    if (hsl) {
      root.style.setProperty("--brand-accent", colors.accent);
      root.style.setProperty("--brand-accent-h", `${hsl.h}`);
      root.style.setProperty("--brand-accent-s", `${hsl.s}%`);
      root.style.setProperty("--brand-accent-l", `${hsl.l}%`);
      // Also set accent for shadcn
      root.style.setProperty("--accent", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  }
}

/**
 * Reset brand colors to defaults
 */
function resetBrandColors() {
  const root = document.documentElement;
  
  // Remove custom properties
  root.style.removeProperty("--brand-primary");
  root.style.removeProperty("--brand-primary-h");
  root.style.removeProperty("--brand-primary-s");
  root.style.removeProperty("--brand-primary-l");
  root.style.removeProperty("--brand-secondary");
  root.style.removeProperty("--brand-secondary-h");
  root.style.removeProperty("--brand-secondary-s");
  root.style.removeProperty("--brand-secondary-l");
  root.style.removeProperty("--brand-accent");
  root.style.removeProperty("--brand-accent-h");
  root.style.removeProperty("--brand-accent-s");
  root.style.removeProperty("--brand-accent-l");
  root.style.removeProperty("--primary");
  root.style.removeProperty("--accent");
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: OrgTheme | null;
}

export function ThemeProvider({ children, initialTheme = null }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<OrgTheme | null>(initialTheme);
  const [isLoading, setIsLoading] = useState(true);

  const setTheme = (newTheme: OrgTheme | null) => {
    setThemeState(newTheme);
    
    if (newTheme?.brandColors) {
      applyBrandColors(newTheme.brandColors);
    } else {
      resetBrandColors();
    }
  };

  // Apply initial theme on mount
  useEffect(() => {
    if (initialTheme?.brandColors) {
      applyBrandColors(initialTheme.brandColors);
    }
    setIsLoading(false);
  }, [initialTheme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetBrandColors();
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the current org theme
 */
export function useOrgTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useOrgTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Get the brand gradient CSS value
 */
export function useBrandGradient(): string {
  const { theme } = useOrgTheme();
  const primary = theme?.brandColors?.primary || DEFAULT_BRAND_COLORS.primary;
  const secondary = theme?.brandColors?.secondary || DEFAULT_BRAND_COLORS.secondary;
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}

/**
 * Get brand colors with defaults
 */
export function useBrandColors(): Required<BrandColors> {
  const { theme } = useOrgTheme();
  return {
    primary: theme?.brandColors?.primary || DEFAULT_BRAND_COLORS.primary!,
    secondary: theme?.brandColors?.secondary || DEFAULT_BRAND_COLORS.secondary!,
    accent: theme?.brandColors?.accent || DEFAULT_BRAND_COLORS.accent!,
  };
}

