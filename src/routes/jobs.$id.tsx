import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JobCard, JobCardSkeleton } from "@/components/jobs/job-card";
import { ErrorState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { employmentTypeLabels, formatDate, formatSalary, formatPosted } from "@/lib/format";
import { applyToJob, listMyApplications } from "@/services/applications.service";
import { getJob, listRelatedJobs } from "@/services/jobs.service";
import type { Job } from "@/types";

export const Route = createFileRoute("/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Job Details — HireFlow" },
      {
        name: "description",
        content: "Read the full job description, responsibilities and qualifications, then apply on HireFlow.",
      },
      { property: "og:title", content: "Job Details — HireFlow" },
      {
        property: "og:description",
        content: "Read the full job description and apply on HireFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobDetailsPage,
});

function JobDetailsPage() {
  const { id } = Route.useParams();
  const session = useSession();

  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [related, setRelated] = useState<Job[] | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let active = true;
    setJob(null);
    setNotFound(false);
    setError(null);
    getJob(id)
      .then((result) => {
        if (!active) return;
        if (!result) setNotFound(true);
        else {
          setJob(result);
          listRelatedJobs(result).then((jobs) => active && setRelated(jobs));
        }
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "This job could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  // Check for an existing application once the signed-in candidate is known.
  useEffect(() => {
    if (!job || session === "loading" || session?.user.role !== "candidate") return;
    let active = true;
    listMyApplications(session.user.id)
      .then((applications) => {
        if (active) setHasApplied(applications.some((application) => application.jobId === job.id));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [job, session]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Job not found</h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            This listing may have been removed, or the link is incorrect. Browse
            the board for other open roles.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/jobs">Back to all jobs</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const user = session === "loading" || session === null ? null : session.user;
  const isCandidate = user?.role === "candidate";
  const closed = job?.status === "closed";

  const handleApply = async () => {
    if (!job || !user) return;
    setApplying(true);
    try {
      await applyToJob({
        jobId: job.id,
        candidateId: user.id,
        candidateName: user.name,
        candidateEmail: user.email,
        candidateTitle: user.title,
        resumeAvailable: Boolean(user.resumeName),
      });
      setHasApplied(true);
      toast.success("Application submitted", {
        description: "Track its status from your dashboard.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit the application.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <Button variant="ghost" size="sm" className="-ml-2 mb-6" asChild>
            <Link to="/jobs">
              <ArrowLeft aria-hidden />
              All jobs
            </Link>
          </Button>

          {error ? (
            <ErrorState
              title="Job couldn't load"
              description={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          ) : !job ? (
            <JobDetailsSkeleton />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="rounded-xl border border-border bg-card p-6 card-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span
                        className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-base font-semibold text-accent-foreground"
                        aria-hidden
                      >
                        {job.companyName.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight">
                          {job.title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {job.companyName} · Posted {formatPosted(job.postedAt)}
                        </p>
                      </div>
                    </div>
                    {closed ? (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-transparent">
                        Closed
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" aria-hidden />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BriefcaseBusiness className="size-4" aria-hidden />
                      {employmentTypeLabels[job.employmentType]}
                      {job.remote ? " · Remote friendly" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" aria-hidden />
                      Posted {formatDate(job.postedAt)}
                    </span>
                  </div>

                  {closed ? (
                    <p
                      role="alert"
                      className="mt-5 flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    >
                      <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
                      This position is no longer accepting applications.
                    </p>
                  ) : null}
                </div>

                <section className="mt-8 space-y-8">
                  <div>
                    <h2 className="font-display text-lg font-semibold">About the role</h2>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                      {job.description}
                    </p>
                  </div>

                  {job.responsibilities.length > 0 ? (
                    <div>
                      <h2 className="font-display text-lg font-semibold">Responsibilities</h2>
                      <ul className="mt-3 space-y-2.5">
                        {job.responsibilities.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {job.qualifications.length > 0 ? (
                    <div>
                      <h2 className="font-display text-lg font-semibold">Qualifications</h2>
                      <ul className="mt-3 space-y-2.5">
                        {job.qualifications.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {job.tags.length > 0 ? (
                    <div>
                      <h2 className="font-display text-lg font-semibold">Skills</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>

              {/* Apply sidebar */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <Card className="card-shadow">
                  <CardContent className="space-y-5 p-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salary</p>
                      <p className="mt-1 font-display text-lg font-semibold">
                        {formatSalary(job)}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Employment type</span>
                        <span className="font-medium">{employmentTypeLabels[job.employmentType]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium">{job.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Remote</span>
                        <span className="font-medium">{job.remote ? "Yes" : "On-site"}</span>
                      </div>
                    </div>
                    <Separator />

                    {hasApplied ? (
                      <div className="rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground">
                        You applied to this job. Track its status in your dashboard.
                      </div>
                    ) : null}

                    {closed ? (
                      <Button className="w-full" size="lg" disabled>
                        Applications closed
                      </Button>
                    ) : !user ? (
                      <Button className="w-full" size="lg" asChild>
                        <Link to="/login" search={{ next: `/jobs/${job.id}` }}>
                          <Send aria-hidden />
                          Sign in to apply
                        </Link>
                      </Button>
                    ) : isCandidate ? (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => void handleApply()}
                        disabled={applying || hasApplied}
                      >
                        <Send aria-hidden />
                        {hasApplied ? "Applied" : applying ? "Submitting…" : "Apply now"}
                      </Button>
                    ) : (
                      <Button className="w-full" size="lg" disabled variant="outline">
                        Employers can't apply
                      </Button>
                    )}

                    {isCandidate && !hasApplied ? (
                      <p className="text-center text-xs text-muted-foreground">
                        Applies with your saved resume
                        {user.resumeName ? ` (${user.resumeName})` : " — add one in your profile"}.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </aside>
            </div>
          )}

          {/* Related jobs */}
          {job ? (
            <section className="mt-14">
              <h2 className="font-display text-xl font-semibold tracking-tight">Related jobs</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related === null
                  ? Array.from({ length: 3 }).map((_, index) => <JobCardSkeleton key={index} />)
                  : related.map((relatedJob) => <JobCard key={relatedJob.id} job={relatedJob} />)}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function JobDetailsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <Skeleton className="mt-5 h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
