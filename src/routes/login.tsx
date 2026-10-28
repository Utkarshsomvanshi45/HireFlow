import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info, LogIn, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoCredentials, login } from "@/services/auth.service";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" && search.next.startsWith("/") ? search.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — HireFlow" },
      {
        name: "description",
        content: "Sign in to your HireFlow account to manage applications or hire talent.",
      },
      { property: "og:title", content: "Sign In — HireFlow" },
      { property: "og:description", content: "Sign in to manage applications or hire talent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!emailPattern.test(email)) nextErrors.email = "Enter a valid email address.";
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const session = await login(email, password);
      toast.success(`Signed in as ${session.user.name}`);
      const fallback = session.user.role === "candidate" ? "/candidate" : "/employer";
      await navigate({ to: search.next ?? fallback });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Sign in failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: keyof typeof demoCredentials) => {
    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
    setErrors({});
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="p-4 sm:p-6">
        <Link to="/" className="inline-flex items-center gap-2.5" aria-label="HireFlow home">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Workflow className="size-4.5" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">HireFlow</span>
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Welcome back. Enter your details to continue.
        </p>

        <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={errors.email ? "border-destructive focus-visible:ring-destructive" : undefined}
            />
            {errors.email ? (
              <p id="login-email-error" role="alert" className="text-xs font-medium text-destructive">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={errors.password ? "border-destructive focus-visible:ring-destructive" : undefined}
            />
            {errors.password ? (
              <p id="login-password-error" role="alert" className="text-xs font-medium text-destructive">
                {errors.password}
              </p>
            ) : null}
          </div>

          {errors.form ? (
            <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors.form}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            <LogIn aria-hidden />
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Prototype note: this is demo authentication backed by sample data —
            any valid email plus an 8+ character password works. Real
            authentication arrives with the backend integration.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("candidate")}>
              Use candidate demo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("employer")}>
              Use employer demo
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to HireFlow?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to homepage
        </Link>
      </main>
    </div>
  );
}
