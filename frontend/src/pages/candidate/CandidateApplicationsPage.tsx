import { Link } from "react-router-dom";
import { CalendarCheck, FileSearch, Mail, SearchX, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  job?: Job | null;
}

export function CandidateApplicationsPage() {
  const session = useSession();
  const [rows, setRows] = useState<EnrichedApplication[] | null>(null);
  const [selectedInterviewApp, setSelectedInterviewApp] = useState<EnrichedApplication | null>(null);
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
        <div className="space-y-4">
          {rows.some((r) => r.status === "interview") ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-primary shrink-0" />
                <p>
                  <strong className="font-semibold text-primary">Interview scheduled!</strong> You have an active interview invitation. Meeting details and instructions were sent to your email. Click &quot;View invite&quot; next to the job status to view details.
                </p>
              </div>
            </div>
          ) : rows.some((r) => r.status === "shortlisted") ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-amber-600 shrink-0" />
                <p>
                  <strong className="font-semibold text-amber-700">Application Shortlisted!</strong> An employer shortlisted your profile. Notification emails with next steps have been sent to your inbox.
                </p>
              </div>
            </div>
          ) : null}

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
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={row.status} />
                        {row.status === "interview" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 gap-1 px-2 text-[11px] text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 font-medium"
                            onClick={() => setSelectedInterviewApp(row)}
                          >
                            <Mail className="size-3" aria-hidden />
                            View invite
                          </Button>
                        ) : row.status === "shortlisted" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            <Sparkles className="size-3" aria-hidden /> Check email
                          </span>
                        ) : null}
                      </div>
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
        </div>
      )}

      <Dialog
        open={Boolean(selectedInterviewApp)}
        onOpenChange={(open) => {
          if (!open) setSelectedInterviewApp(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <DialogTitle>Interview Invitation</DialogTitle>
                <DialogDescription>
                  {selectedInterviewApp?.job?.companyName ?? "Hiring Team"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Position:</span>
                <span className="font-semibold text-foreground">
                  {selectedInterviewApp?.job?.title}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <StatusBadge status="interview" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Invitation sent to:</span>
                <span className="font-medium text-foreground">
                  {session !== "loading" && session ? session.user.email : "Your registered email"}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground/90 space-y-1.5">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <Mail className="size-3.5" /> Meeting details sent to your email
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The recruiter has extended an interview invitation. Meeting link details (Google Meet / Zoom), calendar schedule, and recruiter contact info have been delivered to your email inbox.
              </p>
            </div>

            <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Next steps for you:</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Check your inbox and spam folder for the invitation email.</li>
                <li>Confirm your availability or reply with alternate times.</li>
                <li>Review the job description and have your questions ready.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                const subject = encodeURIComponent(
                  `Re: Interview Invitation - ${selectedInterviewApp?.job?.title ?? "Role"}`
                );
                window.open(`mailto:${selectedInterviewApp?.job?.companyName ?? "recruiter"}?subject=${subject}`);
              }}
            >
              Open Email Client
            </Button>
            <Button onClick={() => setSelectedInterviewApp(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
