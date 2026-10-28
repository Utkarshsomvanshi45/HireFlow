import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Eye,
  Inbox,
  PlusCircle,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeading } from "@/components/shared/page-heading";
import { SummaryCard, SummaryCardSkeleton } from "@/components/shared/summary-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import {
  listApplicationsForCompany,
  type Application,
} from "@/services/applications.service";
import { listEmployerJobs } from "@/services/jobs.service";
import type { Job } from "@/types";

export const Route = createFileRoute("/_employer/")({
  head: () => ({
    meta: [
      { title: "Employer Overview — HireFlow" },
      { name: "description", content: "Your jobs, applicant volume and pipeline health at a glance." },
    ],
  }),
  component: EmployerOverview,
});

function EmployerOverview() {
  const session = useSession();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (session === "loading" || session === null || session.user.role !== "employer") return;
    const company = session.user.companyName ?? "";
    let active = true;
    Promise.all([listEmployerJobs(company), listApplicationsForCompany(company)])
      .then(([jobList, applicationList]) => {
        if (active) {
          setJobs(jobList);
          setApplications(applicationList);
        }
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [session]);

  const activeJobs = jobs?.filter((job) => job.status === "active").length ?? 0;
  const shortlisted =
    applications?.filter((a) => a.status === "shortlisted" || a.status === "interview").length ?? 0;
  const jobTitle = (jobId: string) => jobs?.find((job) => job.id === jobId)?.title;
  const recent = applications?.slice(0, 5) ?? [];

  return (
    <>
      <PageHeading
        title="Employer overview"
        description="A snapshot of your listings and hiring pipeline."
        actions={
          <Button asChild>
            <Link to="/employer/jobs/new">
              <PlusCircle aria-hidden />
              Post a job
            </Link>
          </Button>
        }
      />

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Dashboard data could not be loaded. Please refresh the page.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {jobs === null || applications === null ? (
            Array.from({ length: 4 }).map((_, index) => <SummaryCardSkeleton key={index} />)
          ) : (
            <>
              <SummaryCard label="Total jobs" value={jobs.length} icon={Briefcase} />
              <SummaryCard label="Active jobs" value={activeJobs} icon={Eye} />
              <SummaryCard label="Total applications" value={applications.length} icon={Inbox} />
              <SummaryCard label="In review" value={shortlisted} hint="Shortlisted or interviewing" icon={Users} />
            </>
          )}
        </div>
      )}

      <Card className="card-shadow mt-10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/employer/jobs">
                Manage jobs
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          {applications === null ? (
            <div className="mt-5 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              No applications yet — publish a job to start receiving candidates.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {recent.map((application) => (
                <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{application.candidateName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Applied for {jobTitle(application.jobId) ?? "a job"} · {formatDate(application.appliedAt)}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
