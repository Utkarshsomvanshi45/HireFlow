import { Link } from "react-router-dom";
import { Info, LogIn, ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CenteredPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 card-shadow sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SignInPrompt({ title = "Sign in to continue" }: { title?: string }) {
  return (
    <CenteredPanel className="text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <LogIn className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Dashboards are available to registered users. In this prototype, demo
        credentials let you explore both the candidate and employer views.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild>
          <Link to="/login">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/register">Create account</Link>
        </Button>
      </div>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5" aria-hidden />
        Secure authentication backed by HireFlow.
      </p>
    </CenteredPanel>
  );
}

export function RoleNotice({
  expected,
  signedInRole,
}: {
  expected: "candidate" | "employer";
  signedInRole: "candidate" | "employer";
}) {
  return (
    <CenteredPanel className="text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
        <ShieldAlert className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-xl font-semibold">This area is for {expected}s</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You are signed in with a {signedInRole} account. Switch accounts or head
        to your own dashboard.
      </p>
      <Button className="mt-6" asChild>
        <Link to={signedInRole === "candidate" ? "/candidate" : "/employer"}>Go to my dashboard</Link>
      </Button>
      <Button variant="ghost" className="mt-2 block w-full" onClick={() => {
        // Signing out here lets the user flip roles for the demo.
        window.location.href = "/login";
      }}>
        <UserPlus className="mr-2 size-4" aria-hidden />
        Switch account
      </Button>
    </CenteredPanel>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-border" />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded bg-muted" />
          <div className="h-4 w-80 rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl border border-border bg-card p-5">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="mt-3 h-8 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
