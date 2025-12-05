import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  ImageIcon, 
  FileText, 
  ClipboardList,
  Menu,
  Users,
  FolderKanban,
  Map,
} from "lucide-react";
import { Button } from "@soundsgood/ui";
import { auth } from "@soundsgood/auth";
import { db, organizations, eq } from "@soundsgood/db";
import { SignOutButton } from "./SignOutButton";
import { PortalThemeProvider } from "./PortalThemeProvider";

// Client-facing navigation (for users with projects)
const clientNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Photos", href: "/photos", icon: ImageIcon },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Project Status", href: "/project-status", icon: ClipboardList },
  { name: "Roadmap", href: "/roadmap", icon: Map },
];

// Admin navigation (project managers, not clients)
const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Clients", href: "/clients", icon: Users },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the session on the server
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, redirect to login (middleware should handle this, but double-check)
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const isAdmin = (user as any).role === "admin";
  const organizationId = (user as any).organizationId;
  
  // Fetch organization data for theming (if user belongs to an org)
  let orgTheme = null;
  if (organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    
    if (org) {
      orgTheme = {
        brandColors: org.settings?.brandColors,
        logoUrl: org.settings?.logo,
        organizationName: org.name,
      };
    }
  }
  
  // Admin users get admin-focused navigation, clients get client navigation
  const navigation = isAdmin ? adminNavigation : clientNavigation;
  const initials = user.name 
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <PortalThemeProvider initialTheme={orgTheme}>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1">
          {/* Sidebar - fixed height, never scrolls as a whole */}
          <aside className="hidden w-64 flex-col border-r bg-card lg:flex h-screen sticky top-0 overflow-hidden">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b px-6 shrink-0">
              {!isAdmin && orgTheme?.logoUrl ? (
                <img 
                  src={orgTheme.logoUrl} 
                  alt={orgTheme.organizationName || "Logo"} 
                  className="h-8 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  SG
                </div>
              )}
              <span className="font-semibold truncate">
                {isAdmin ? "Admin Portal" : (orgTheme?.organizationName || "Client Portal")}
              </span>
            </div>

            {/* Navigation - scrolls independently if needed */}
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto min-h-0">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User section - always visible at bottom */}
            <div className="border-t p-4 shrink-0">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {initials}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <SignOutButton />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex flex-1 flex-col min-h-screen">
            {/* Mobile header */}
            <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:hidden sticky top-0 z-10">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
              {orgTheme?.logoUrl ? (
                <img 
                  src={orgTheme.logoUrl} 
                  alt={orgTheme.organizationName || "Logo"} 
                  className="h-8 w-auto max-w-[100px] object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  SG
                </div>
              )}
              <span className="font-semibold truncate">
                {orgTheme?.organizationName || "Client Portal"}
              </span>
            </header>

            {/* Page content with bottom padding */}
            <main className="flex-1 bg-background pb-[200px]">
              {children}
            </main>
          </div>
        </div>
      </div>
    </PortalThemeProvider>
  );
}
