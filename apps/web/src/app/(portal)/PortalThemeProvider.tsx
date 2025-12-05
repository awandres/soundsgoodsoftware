"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface OrgTheme {
  brandColors?: BrandColors;
  logoUrl?: string;
  organizationName?: string;
}

interface PortalThemeProviderProps {
  children: ReactNode;
  initialTheme: OrgTheme | null;
}

export function PortalThemeProvider({ children, initialTheme }: PortalThemeProviderProps) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      {children}
    </ThemeProvider>
  );
}

