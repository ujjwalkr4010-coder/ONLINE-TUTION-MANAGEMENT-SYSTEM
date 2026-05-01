import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, type ReactNode } from "react";
import {
  GraduationCap, LayoutDashboard, BookOpen, ClipboardCheck, FileText,
  CreditCard, Video, Bot, LogOut, Users, Sparkles, User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navByRole = {
  admin: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/dashboard/users", icon: Users, label: "Users" },
    { to: "/dashboard/courses", icon: BookOpen, label: "Courses" },
    { to: "/dashboard/payments", icon: CreditCard, label: "Payments" },
    { to: "/dashboard/chatbot", icon: Bot, label: "AI Assistant" },
  ],
  tutor: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/dashboard/courses", icon: BookOpen, label: "My Courses" },
    { to: "/dashboard/attendance", icon: ClipboardCheck, label: "Attendance" },
    { to: "/dashboard/assignments", icon: FileText, label: "Assignments" },
    { to: "/dashboard/live", icon: Video, label: "Live Classes" },
    { to: "/dashboard/chatbot", icon: Bot, label: "AI Assistant" },
  ],
  student: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/dashboard/courses", icon: BookOpen, label: "Courses" },
    { to: "/dashboard/assignments", icon: FileText, label: "Assignments" },
    { to: "/dashboard/attendance", icon: ClipboardCheck, label: "Attendance" },
    { to: "/dashboard/payments", icon: CreditCard, label: "Fees" },
    { to: "/dashboard/live", icon: Video, label: "Live Classes" },
    { to: "/dashboard/performance", icon: Sparkles, label: "AI Insights" },
    { to: "/dashboard/chatbot", icon: Bot, label: "AI Assistant" },
  ],
} as const;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role, loading, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const items = role ? navByRole[role] : navByRole.student;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-mint shadow-mint">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">OTMS</span>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((it) => {
            const active = loc.pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-mint"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.email}</div>
              <div className="text-xs uppercase tracking-wide text-sidebar-foreground/60">{role}</div>
            </div>
          </div>
          <Button onClick={signOut} variant="ghost" className="mt-2 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-mint">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">OTMS</span>
        </Link>
        <Button onClick={signOut} size="icon" variant="ghost" className="text-sidebar-foreground"><LogOut className="h-4 w-4" /></Button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-card py-2 md:hidden">
        {items.slice(0, 5).map((it) => {
          const active = loc.pathname === it.to;
          return (
            <Link key={it.to} to={it.to} className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px]",
              active ? "text-primary" : "text-muted-foreground",
            )}>
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-16 md:px-8 md:pb-8 md:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
