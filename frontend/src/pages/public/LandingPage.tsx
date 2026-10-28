import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserSearch,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JobCard, JobCardSkeleton } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listJobs } from "@/services/jobs.service";
import type { Job } from "@/types";

const sampleStats = [
  { value: "12,400+", label: "Active jobs" },
  { value: "3,800", label: "Hiring companies" },
  { value: "92%", label: "Applications answered" },
  { value: "18 days", label: "Median time to hire" },
];

const steps = [
  {
    icon: UserSearch,
    title: "Create your profile",
    text: "Tell us who you are, add your resume and set your job preferences in minutes.",
  },
  {
    icon: Send,
    title: "Apply in one click",
    text: "Apply to matching roles with your saved resume — no repetitive forms.",
  },
  {
    icon: TrendingUp,
    title: "Track every status",
    text: "Follow each application from submitted to shortlisted, interview and offer.",
  },
];

const candidateBenefits = [
  "Personalized dashboard with every application in one place",
  "Clear status badges — always know where you stand",
  "Apply with a saved resume instead of retyping your history",
  "Realistic salary ranges published on every listing",
];

const employerBenefits = [
  "Publish jobs with structured details candidates actually read",
  "A hiring pipeline: applied, shortlisted, interview, hired, rejected",
  "Applicant management with resume visibility and quick actions",
  "Private notes kept separate from anything candidates see",
];

export function LandingPage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Job[] | null>(null);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    let active = true;
    listJobs()
      .then((jobs) => {
        if (active) {
          setFeatured(
            jobs
              .filter((job) => job.status === "active")
              .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
              .slice(0, 6),
          );
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    const query = params.toString();
    navigate(`/jobs${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <Sparkles className="size-3.5" aria-hidden />
                Hiring platform for candidates and employers
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                From application to opportunity.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                HireFlow connects companies with the right people. Search roles,
                apply with your resume, and track every step — or publish jobs
                and manage candidates in one clean pipeline.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/jobs">
                    Explore Jobs
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">Hire Talent</Link>
                </Button>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="mt-10 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 card-shadow sm:flex-row sm:items-center sm:gap-2 sm:p-2 sm:pl-4"
              role="search"
              aria-label="Search jobs"
            >
              <div className="flex flex-1 items-center gap-2">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <Input
                  aria-label="Job title, company or keyword"
                  placeholder="Job title, company, or keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
              <Input
                aria-label="Location"
                placeholder="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 sm:max-w-[220px]"
              />
              <Button type="submit" className="sm:px-6">
                Search
              </Button>
            </form>
          </div>
        </section>

        {/* Sample statistics */}
        <section aria-label="Product statistics" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <dl className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
              {sampleStats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {stat.value}
                  </dd>
                  <dt className="mt-1 text-sm text-muted-foreground">{stat.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Sample data shown for demonstration purposes.
            </p>
          </div>
        </section>

        {/* Featured jobs */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Featured jobs
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Fresh openings from companies hiring right now.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/jobs">
                View all jobs
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {error ? (
              <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-3">
                Featured jobs could not be loaded. Please refresh the page.
              </p>
            ) : featured === null ? (
              Array.from({ length: 6 }).map((_, index) => <JobCardSkeleton key={index} />)
            ) : (
              featured.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
              Three steps between you and your next role.
            </p>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-border bg-card p-6 card-shadow">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <step.icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-display text-sm font-semibold text-muted-foreground">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Candidate and employer benefits */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 card-shadow">
              <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileText className="size-5.5" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-xl font-semibold sm:text-2xl">
                For candidates
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Everything you need to land the role, in one dashboard.
              </p>
              <ul className="mt-6 space-y-3">
                {candidateBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-7" variant="outline" asChild>
                <Link to="/register">Create a candidate account</Link>
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 card-shadow">
              <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <BriefcaseBusiness className="size-5.5" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-xl font-semibold sm:text-2xl">
                For employers
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Post jobs and move candidates through a structured pipeline.
              </p>
              <ul className="mt-6 space-y-3">
                {employerBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-7" asChild>
                <Link to="/register">
                  Start hiring
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-xl border border-border bg-primary px-6 py-10 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Ready to make your next move?
              </h2>
              <p className="mt-2 max-w-lg text-sm text-primary-foreground/80">
                Join HireFlow as a candidate or an employer — it takes less than
                two minutes to get started.
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                <Users aria-hidden />
                Get started free
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
