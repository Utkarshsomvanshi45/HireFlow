import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, FileText, FileWarning, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { formatDate } from "@/lib/format";
import {
  listApplicationsForJob,
  updateApplicationStatus,
  type Application,
} from "@/services/applications.service";
import { getJob } from "@/services/jobs.service";
import type { ApplicationStatus, Job } from "@/types";

export const Route = createFileRoute("/_employer/jobs/$id/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants — HireFlow" },
      { name: "description", content: "Review and manage applicants for a job listing." },
    ],
  }),
  component: ApplicantsPage,
});

/** Next actions offered per current status — keeps the table uncluttered. */
const nextActions: Record<ApplicationStatus, Array<{ label: string; to: ApplicationStatus }>> = {
  applied: [
    { label: "Shortlist", to: "shortlisted" },
    { label: "Reject", to: "rejected" },
  ],
  shortlisted: [
    { label: "Interview", to: "interview" },
    { label: "Reject", to: "rejected" },
  ],
  interview: [
    { label: "Hire", to: "hired" },
    { label: "Reject", to: "rejected" },
  ],
  hired: [],
  rejected: [{ label: "Restore", to: "applied" }],
};

function ApplicantsPage() {
  const { id } = Route.useParams();
  const [job, setJob] = useState<Job | null | "error">(null);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setJob(null);
    setApplications(null);
    setError(false);
    getJob(id)
      .then((result) => {
        if (!active) return;
        if (!result) setJob("error");
        else setJob(result);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!job || job === "error") return;
    let active = true;
    listApplicationsForJob(job.id)
      .then((apps) => active && setApplications(apps))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [job, reloadKey]);

  const changeStatus = async (application: Application, status: ApplicationStatus) => {
    setBusyId(application.id);
    try {
      await updateApplicationStatus(application.id, status);
      setApplications((prev) =>
        prev
          ? prev.map((item) => (item.id === application.id ? { ...item, status } : item))
          : prev,
      );
      toast.success(`${application.candidateName} → ${status}`);
    } catch {
      toast.error("Could not update the applicant's status.");
    } finally {
      setBusyId(null);
    }
  };

  if (error || job === "error") {
    return (
      <ErrorState
        title={job === "error" ? "Job not found" : "Applicants couldn't load"}
        description={job === "error" ? "This listing may have been removed." : undefined}
        onRetry={job !== "error" ? () => setReloadKey((key) => key + 1) : undefined}
      />
    );
  }

  if (!job || applications === null) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 rounded bg-muted" />
        <div className="h-72 rounded-xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <>
      <PageHeading
        title={`Applicants — ${job.title}`}
        description={`${applications.length} ${applications.length === 1 ? "candidate has" : "candidates have"} applied.`}
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link to="/employer/jobs/$id/pipeline" params={{ id: job.id }}>
                Pipeline view
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/employer/jobs">
                <ArrowLeft aria-hidden />
                All jobs
              </Link>
            </Button>
          </>
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Share the listing or give it a few days — new applications appear here instantly."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card card-shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <p className="font-medium">{application.candidateName}</p>
                    <p className="text-xs text-muted-foreground">{application.candidateEmail}</p>
                    {application.candidateTitle ? (
                      <p className="text-xs text-muted-foreground">{application.candidateTitle}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(application.appliedAt)}
                  </TableCell>
                  <TableCell>
                    {application.resumeAvailable ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-success-foreground/90 text-foreground">
                        <FileText className="size-4 text-primary" aria-hidden />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <FileWarning className="size-4" aria-hidden />
                        Missing
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {nextActions[application.status].length === 0 ? (
                        <span className="text-xs text-muted-foreground">No further actions</span>
                      ) : (
                        nextActions[application.status].map((action) => (
                          <Button
                            key={action.to}
                            variant={action.to === "rejected" ? "ghost" : "outline"}
                            size="sm"
                            disabled={busyId === application.id}
                            onClick={() => void changeStatus(application, action.to)}
                          >
                            {action.label}
                          </Button>
                        ))
                      )}
                    </div>
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
