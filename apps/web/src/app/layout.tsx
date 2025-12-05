import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminToolkit } from "@/components/AdminToolkit";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SoundsGood Software - Client Portal",
  description: "Manage your projects, documents, and content in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {children}
        <AdminToolkit />
      </body>
    </html>
  );
}

