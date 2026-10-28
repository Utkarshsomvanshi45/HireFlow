import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Eye,
  FileText,
  Inbox,
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
import type { Application } from "@/types";

export const Route = createFileRoute("/_candidate/")({
  head: () => ({
    meta: [
      { title: "Candidate Overview — HireFlow" },
      { name: "description", content: "A summary of your applications, interviews and offers on HireFlow." },
    ],
  }),
  component: CandidateOverview,
});

function CandidateOverview() {
  const session = useSession();
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (session === "loading" || session === null) return;
    let active = true;
    listMyApplications(session.user.id)
      .then((apps) => active && setApplications(apps))
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
                        to="/jobs/$id"
                        params={{ id: application.jobId }}
                        className="block truncate text-sm font-medium hover:text-primary hover:underline"
                      >
                        {application.jobId.replace("job-", "Job #")}
                      </Link>
                      <p className="text-xs text-muted-foreground">Applied {formatDate(application.appliedAt)}</p>
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
