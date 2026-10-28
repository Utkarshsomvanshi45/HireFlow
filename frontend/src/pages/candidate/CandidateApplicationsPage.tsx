import { Link } from "react-router-dom";
import { FileSearch, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { listMyApplications } from "@/services/applications.service";
import { getJob } from "@/services/jobs.service";
import type { Application, Job } from "@/types";

interface EnrichedApplication extends Application {
  job?: Job;
}

export function CandidateApplicationsPage() {
  const session = useSession();
  const [rows, setRows] = useState<EnrichedApplication[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = "My Applications — HireFlow";
  }, []);

  useEffect(() => {
    if (session === "loading" || session === null) return;
    let active = true;
    setRows(null);
    setError(false);
    listMyApplications(session.user.id)
      .then(async (applications) => {
        const jobs = await Promise.all(
          applications.map(async (application) => {
            try {
              return await getJob(application.jobId);
            } catch {
              return undefined;
            }
          }),
        );
        if (active)
          setRows(
            applications.map((application, index) => ({ ...application, job: jobs[index] })),
          );
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [session, reloadKey]);

  return (
    <>
      <PageHeading
        title="My applications"
        description="Every role you've applied to, with its current status."
        actions={
          <Button variant="outline" asChild>
            <Link to="/jobs">Browse more jobs</Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState
          title="Applications couldn't load"
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : rows === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No applications yet"
          description="When you apply to a job, it shows up here with live status updates from the employer."
          action={
            <Button asChild>
              <Link to="/jobs">Find your first role</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card card-shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.job?.title ?? "Listing removed"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.job?.companyName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(row.appliedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {row.job ? (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/jobs/${row.jobId}`}>
                          <FileSearch aria-hidden />
                          View
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unavailable</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

