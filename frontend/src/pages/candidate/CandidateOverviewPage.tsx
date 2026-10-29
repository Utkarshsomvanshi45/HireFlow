import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  Eye,
  FileText,
  Inbox,
  Mail,
  Send,
  Trophy,
  UserRound,
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
import { listMyApplications } from "@/services/applications.service";
import { getJob } from "@/services/jobs.service";
import type { Application, Job } from "@/types";

interface EnrichedApplication extends Application {
  job?: Job | null;
}

export function CandidateOverviewPage() {
  const session = useSession();
  const [applications, setApplications] = useState<EnrichedApplication[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.title = "Candidate Overview — HireFlow";
  }, []);

  useEffect(() => {
    if (session === "loading" || session === null) return;
    let active = true;
    listMyApplications(session.user.id)
      .then(async (apps) => {
        if (!active) return;
        const jobs = await Promise.all(
          apps.map(async (app) => {
            try {
              return await getJob(app.jobId);
            } catch {
              return null;
            }
          }),
        );
        if (active) {
          setApplications(
            apps.map((app, index) => ({
              ...app,
              job: jobs[index] ?? (app as EnrichedApplication).job,
            })),
          );
        }
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [session]);

  const underReview = applications?.filter((a) => a.status === "applied" || a.status === "shortlisted").length ?? 0;
  const interviews = applications?.filter((a) => a.status === "interview").length ?? 0;
  const offers = applications?.filter((a) => a.status === "hired").length ?? 0;
  const recent = applications?.slice(0, 4) ?? [];

  return (
    <>
      <PageHeading
        title={`Welcome back${session === "loading" || session === null ? "" : `, ${session.user.name.split(" ")[0]}`}`}
        description="Here's where every application stands right now."
        actions={
          <Button asChild>
            <Link to="/jobs">Browse jobs</Link>
          </Button>
        }
      />

      {/* Dynamic Status Notifications for Candidate */}
      {interviews > 0 ? (
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:p-5 card-shadow">
          <div className="flex items-start gap-3.5">
            <div className="rounded-full bg-primary/10 p-2.5 text-primary">
              <CalendarCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-foreground">
                  Interview Invitation Received!
                </h3>
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  Action required
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                You have {interviews} interview invitation{interviews > 1 ? "s" : ""}. An email notification with calendar and meeting details has been sent to your inbox.
              </p>
            </div>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5" asChild>
            <Link to="/candidate/applications">
              <Mail className="size-4" />
              View Invitations
            </Link>
          </Button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Your applications could not be loaded. Please refresh the page.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {applications === null ? (
            Array.from({ length: 4 }).map((_, index) => <SummaryCardSkeleton key={index} />)
          ) : (
            <>
              <SummaryCard label="Total applications" value={applications.length} icon={Inbox} />
              <SummaryCard label="Under review" value={underReview} hint="Applied or shortlisted" icon={Eye} />
              <SummaryCard label="Interviews" value={interviews} icon={FileText} />
              <SummaryCard label="Offers" value={offers} icon={Trophy} />
            </>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Recent applications</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/candidate/applications">
                  View all
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            {applications === null ? (
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">
                You haven't applied to any jobs yet. Browse the board to get started.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-border">
                {recent.map((application) => (
                  <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        to={`/jobs/${application.jobId}`}
                        className="block truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {application.job?.title ?? "Position"}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {application.job?.companyName ? `${application.job.companyName} • ` : ""}Applied {formatDate(application.appliedAt)}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow h-fit">
          <CardContent className="p-6">
            <h2 className="font-display text-lg font-semibold">Quick actions</h2>
            <div className="mt-4 space-y-2.5">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/jobs">
                  <Send aria-hidden />
                  Find new roles
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/candidate/applications">
                  <FileText aria-hidden />
                  Review applications
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/candidate/profile">
                  <UserRound aria-hidden />
                  Update profile & resume
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

