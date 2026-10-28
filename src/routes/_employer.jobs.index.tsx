import { Link, createFileRoute } from "@tanstack/react-router";
import { Ban, Eye, FileEdit, PlusCircle, RotateCcw, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-session";
import { formatDate, formatPosted, jobStatusLabels } from "@/lib/format";
import { listApplicationsForCompany } from "@/services/applications.service";
import { listEmployerJobs, setJobStatus } from "@/services/jobs.service";
import type { Application, Job } from "@/types";

export const Route = createFileRoute("/_employer/jobs/")({
  head: () => ({
    meta: [
      { title: "Manage Jobs — HireFlow" },
      { name: "description", content: "Search, edit, publish and close your job listings." },
    ],
  }),
  component: ManageJobsPage,
});

function ManageJobsPage() {
  const session = useSession();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [closingJob, setClosingJob] = useState<Job | null>(null);

  useEffect(() => {
    if (session === "loading" || session === null || session.user.role !== "employer") return;
    const company = session.user.companyName ?? "";
    let active = true;
    Promise.all([listEmployerJobs(company), listApplicationsForCompany(company)])
      .then(([jobList, applicationList]) => {
        if (!active) return;
        setJobs(jobList);
        const nextCounts: Record<string, number> = {};
        applicationList.forEach((application: Application) => {
          nextCounts[application.jobId] = (nextCounts[application.jobId] ?? 0) + 1;
        });
        setCounts(nextCounts);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [session, reloadKey]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return jobs;
    return jobs.filter((job) =>
      [job.title, job.location, job.status].join(" ").toLowerCase().includes(needle),
    );
  }, [jobs, query]);

  const changeStatus = async (job: Job, status: Job["status"], successMessage: string) => {
    try {
      await setJobStatus(job.id, status);
      toast.success(successMessage);
      setReloadKey((key) => key + 1);
    } catch {
      toast.error("Could not update the job status.");
    } finally {
      setClosingJob(null);
    }
  };

  return (
    <>
      <PageHeading
        title="Manage jobs"
        description="All of your listings — drafts, open roles and closed ones."
        actions={
          <Button asChild>
            <Link to="/employer/jobs/new">
              <PlusCircle aria-hidden />
              Post a job
            </Link>
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          aria-label="Search your jobs"
          placeholder="Search by title, location or status"
          className="pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState title="Jobs couldn't load" onRetry={() => setReloadKey((key) => key + 1)} />
        ) : jobs === null ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={query ? Search : FileEdit}
            title={query ? "No jobs match your search" : "No jobs yet"}
            description={
              query
                ? "Try a different keyword, or clear the search to see all listings."
                : "Publish your first listing and start receiving applications."
            }
            action={
              query ? (
                <Button variant="outline" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/employer/jobs/new">Post a job</Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card card-shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job title</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        to="/employer/jobs/$id/edit"
                        params={{ id: job.id }}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.location}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPosted(job.postedAt)}
                      <p className="text-xs">{formatDate(job.postedAt)}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} variant="job" />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{counts[job.id] ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/employer/jobs/$id/edit" params={{ id: job.id }}>
                            <FileEdit aria-hidden />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/employer/jobs/$id/applicants" params={{ id: job.id }}>
                            <Users aria-hidden />
                            Applicants
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/employer/jobs/$id/pipeline" params={{ id: job.id }}>
                            <Eye aria-hidden />
                            Pipeline
                          </Link>
                        </Button>
                        {job.status === "active" ? (
                          <Button variant="ghost" size="sm" onClick={() => setClosingJob(job)}>
                            <Ban aria-hidden />
                            Close
                          </Button>
                        ) : job.status === "closed" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void changeStatus(job, "active", "Job reopened")}
                          >
                            <RotateCcw aria-hidden />
                            Reopen
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void changeStatus(job, "active", "Job published")}
                          >
                            <RotateCcw aria-hidden />
                            Publish
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog
        open={closingJob !== null}
        onOpenChange={(open) => !open && setClosingJob(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close “{closingJob?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The listing will stop accepting new applications and appears as
              closed to candidates. Existing applicants keep their status, and
              you can reopen the job at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => closingJob && void changeStatus(closingJob, "closed", "Job closed")}
            >
              {`Close job`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="mt-6 text-xs text-muted-foreground">
        Statuses: {Object.values(jobStatusLabels).join(" · ")} — drafts are only
        visible to your team.
      </p>
    </>
  );
}
