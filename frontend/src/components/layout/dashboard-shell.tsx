import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { logout } from "@/services/auth.service";
import type { UserRole } from "@/types";
import {
  DashboardSkeleton,
  RoleNotice,
  SignInPrompt,
} from "@/components/shared/dashboard-guards";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  exact?: boolean;
  /** External to the dashboard (still in-app). */
  section?: "main" | "secondary";
}

const navByRole: Record<UserRole, NavItem[]> = {
  candidate: [
    { to: "/candidate", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/candidate/applications", label: "My Applications", icon: FileText },
    { to: "/candidate/profile", label: "Profile", icon: UserRound },
  ],
  employer: [
    { to: "/employer", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/employer/jobs", label: "Manage Jobs", icon: Briefcase },
    { to: "/employer/jobs/new", label: "Post a Job", icon: PlusCircle },
  ],
};

export function DashboardShell({ role }: { role: UserRole }) {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (session === "loading") return <DashboardSkeleton />;
  if (!session)
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <SignInPrompt
          title={role === "candidate" ? "Sign in to your candidate dashboard" : "Sign in to your employer dashboard"}
        />
      </div>
    );

  const user = session.user;
  if (user.role !== role)
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <RoleNotice expected={role} signedInRole={user.role} />
      </div>
    );

  const items = navByRole[role];
  const companyLabel = role === "employer" ? user.companyName ?? "Your company" : "Candidate workspace";

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const renderNav = (onNavigate?: () => void) => (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.exact
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={onNavigate}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <div className="my-3 border-t border-sidebar-border" />
      <Link
        to="/jobs"
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={onNavigate}
      >
        <Search className="size-4" aria-hidden />
        Browse Jobs
      </Link>
      <Link
        to="/"
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={onNavigate}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to Site
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-2.5" aria-label="HireFlow home">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Workflow className="size-4.5" aria-hidden />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">HireFlow</span>
          </Link>
        </div>
        <div className="px-4 py-4 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/50">
          {companyLabel}
        </div>
        <div className="flex-1 overflow-y-auto px-3">{renderNav()}</div>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleSignOut}>
            <LogOut aria-hidden />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="HireFlow home">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Workflow className="size-4" aria-hidden />
            </span>
            <span className="font-display text-base font-semibold">HireFlow</span>
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </header>

        {mobileOpen ? (
          <div className="border-b border-border bg-background px-4 pb-4 pt-2 lg:hidden">
            <div className="mb-3 text-sm font-medium text-muted-foreground">{user.name} · {user.email}</div>
            {renderNav(() => setMobileOpen(false))}
            <Button variant="outline" className="mt-4 w-full" onClick={handleSignOut}>
              <LogOut aria-hidden />
              Sign out
            </Button>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
