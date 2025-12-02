import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  ImageIcon, 
  FileText, 
  Settings, 
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@soundsgood/ui";
import { auth } from "@soundsgood/auth";
import { SignOutButton } from "./SignOutButton";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Photos", href: "/photos", icon: ImageIcon },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
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
  const initials = user.name 
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SG
          </div>
          <span className="font-semibold">Client Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
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

        {/* User section */}
        <div className="border-t p-4">
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
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SG
          </div>
          <span className="font-semibold">Client Portal</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

