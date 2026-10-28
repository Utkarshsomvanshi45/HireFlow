import { Link, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Info, UserRound, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/services/auth.service";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  companyName?: string;
  form?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Create Account — HireFlow";
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Enter your full name.";
    if (!emailPattern.test(email)) nextErrors.email = "Enter a valid email address.";
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (confirm !== password) nextErrors.confirm = "Passwords do not match.";
    if (role === "employer" && !companyName.trim())
      nextErrors.companyName = "Enter your company name.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const session = await register({
        role,
        name,
        email,
        password,
        companyName: role === "employer" ? companyName : undefined,
      });
      toast.success(`Welcome to HireFlow, ${session.user.name.split(" ")[0]}`);
      navigate(session.user.role === "candidate" ? "/candidate" : "/employer");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Registration failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const errorClass = (problem?: string) =>
    problem ? "border-destructive focus-visible:ring-destructive" : undefined;
  const errorText = (id: string, problem?: string) =>
    problem ? (
      <p id={id} role="alert" className="text-xs font-medium text-destructive">
        {problem}
      </p>
    ) : null;

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

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose how you want to use HireFlow.
        </p>

        {/* Role choice — visually explicit, keyboard accessible radios */}
        <fieldset className="mt-7">
          <legend className="text-sm font-medium">I want to…</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  value: "candidate" as UserRole,
                  icon: UserRound,
                  title: "Find a job",
                  text: "Search roles, apply with your resume and track applications.",
                },
                {
                  value: "employer" as UserRole,
                  icon: BriefcaseBusiness,
                  title: "Hire talent",
                  text: "Publish jobs and manage candidates in a hiring pipeline.",
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                  role === option.value
                    ? "border-primary bg-accent/60 ring-2 ring-ring/40"
                    : "border-border bg-card hover:bg-accent/30",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="mt-1 accent-[var(--color-primary)]"
                  aria-label={option.title}
                />
                <span>
                  <span className="flex items-center gap-2 font-display text-sm font-semibold">
                    <option.icon className="size-4" aria-hidden />
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{option.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="register-name">Full name</Label>
            <Input
              id="register-name"
              autoComplete="name"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              className={errorClass(errors.name)}
            />
            {errorText("register-name-error", errors.name)}
          </div>

          {role === "employer" ? (
            <div className="space-y-2">
              <Label htmlFor="register-company">Company name</Label>
              <Input
                id="register-company"
                autoComplete="organization"
                placeholder="e.g. Northwind Labs"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                aria-invalid={Boolean(errors.companyName)}
                aria-describedby={errors.companyName ? "register-company-error" : undefined}
                className={errorClass(errors.companyName)}
              />
              {errorText("register-company-error", errors.companyName)}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              className={errorClass(errors.email)}
            />
            {errorText("register-email-error", errors.email)}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="8+ characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "register-password-error" : undefined}
                className={errorClass(errors.password)}
              />
              {errorText("register-password-error", errors.password)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-confirm">Confirm password</Label>
              <Input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                aria-invalid={Boolean(errors.confirm)}
                aria-describedby={errors.confirm ? "register-confirm-error" : undefined}
                className={errorClass(errors.confirm)}
              />
              {errorText("register-confirm-error", errors.confirm)}
            </div>
          </div>

          {errors.form ? (
            <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors.form}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting
              ? "Creating account…"
              : role === "candidate"
                ? "Create candidate account"
                : "Create employer account"}
          </Button>
        </form>

        <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Prototype note: accounts created here live in demo storage with sample
          data. The backend integration replaces this flow without UI changes.
        </p>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

