import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getPrivateNotes,
  listApplicationsForJob,
  savePrivateNotes,
  updateApplicationStatus,
  type Application,
} from "@/services/applications.service";
import { getJob } from "@/services/jobs.service";
import type { ApplicationStatus, Job } from "@/types";

const columns: Array<{ key: ApplicationStatus; title: string }> = [
  { key: "applied", title: "Applied" },
  { key: "shortlisted", title: "Shortlisted" },
  { key: "interview", title: "Interview" },
  { key: "hired", title: "Hired" },
  { key: "rejected", title: "Rejected" },
];

export function EmployerPipelinePage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null | "error">(null);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Private notes state (employer-only, never shown to candidates).
  const [notesJobId, setNotesJobId] = useState(id ?? "");
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    document.title = "Hiring Pipeline — HireFlow";
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setJob(null);
    setApplications(null);
    setNotesJobId(id);
    getJob(id)
      .then((result) => active && setJob(result ?? "error"))
      .catch(() => active && setJob("error"));
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    if (!job || job === "error") return;
    let active = true;
    listApplicationsForJob(job.id)
      .then((apps) => active && setApplications(apps))
      .catch(() => active && setJob("error"));
    return () => {
      active = false;
    };
  }, [job]);

  useEffect(() => {
    if (!job || job === "error") return;
    let active = true;
    setNotesLoading(true);
    getPrivateNotes(job.id)
      .then((saved) => {
        if (active) {
          setNotes(saved);
          setNotesLoading(false);
        }
      })
      .catch(() => active && setNotesLoading(false));
    return () => {
      active = false;
    };
  }, [job]);

  const moveApplication = async (applicationId: string, status: ApplicationStatus) => {
    const previous = applications;
    setApplications((prev) =>
      prev ? prev.map((item) => (item.id === applicationId ? { ...item, status } : item)) : prev,
    );
    setDraggedId(null);
    setDragOverColumn(null);
    try {
      await updateApplicationStatus(applicationId, status);
      toast.success(`Moved to ${columns.find((column) => column.key === status)?.title}`);
    } catch {
      setApplications(previous);
      toast.error("Could not move the candidate. Please try again.");
    }
  };

  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      await savePrivateNotes(notesJobId, notes);
      toast.success("Private notes saved");
    } catch {
      toast.error("Could not save the notes.");
    } finally {
      setNotesSaving(false);
    }
  };

  if (job === "error") {
    return <ErrorState title="Job not found" description="This listing may have been removed." />;
  }

  if (!job || applications === null) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 rounded bg-muted" />
        <div className="h-96 rounded-xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <>
      <PageHeading
        title={`Hiring pipeline — ${job.title}`}
        description="Drag a candidate between columns, or use the menu on their card."
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link to={`/employer/jobs/${job.id}/applicants`}>
                Table view
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

      <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-5">
        {columns.map((column) => {
          const cards = applications.filter((application) => application.status === column.key);
          return (
            <section
              key={column.key}
              aria-label={`${column.title} column, ${cards.length} candidates`}
              className={cn(
                "flex min-h-64 w-72 shrink-0 flex-col rounded-xl border bg-muted/30 lg:w-auto",
                dragOverColumn === column.key ? "border-primary/50 bg-accent/40" : "border-border",
              )}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverColumn(column.key);
              }}
              onDragLeave={() => setDragOverColumn((current) => (current === column.key ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedId) void moveApplication(draggedId, column.key);
              }}
            >
              <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="font-display text-sm font-semibold">{column.title}</h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {cards.length}
                </span>
              </header>
              <div className="flex flex-1 flex-col gap-2.5 p-3">
                {cards.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Drop candidates here
                  </p>
                ) : (
                  cards.map((application) => (
                    <article
                      key={application.id}
                      draggable
                      onDragStart={() => setDraggedId(application.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className={cn(
                        "cursor-grab rounded-lg border border-border bg-card p-3.5 card-shadow transition-opacity",
                        draggedId === application.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{application.candidateName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {application.candidateTitle ?? application.candidateEmail}
                          </p>
                        </div>
                        {application.resumeAvailable ? (
                          <span
                            className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                            title="Resume available"
                          >
                            CV
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {application.appliedAt}
                        </span>
                        <Select
                          value={application.status}
                          onValueChange={(value) => void moveApplication(application.id, value as ApplicationStatus)}
                        >
                          <SelectTrigger
                            aria-label={`Move ${application.candidateName} to another stage`}
                            className="h-7 w-[104px] px-2 text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((option) => (
                              <SelectItem key={option.key} value={option.key} className="text-xs">
                                {option.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Private employer notes — deliberately separated from candidate-facing data */}
      <Card className="card-shadow mt-10 border-warning/40">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
                <ClipboardList className="size-4.5" aria-hidden />
              </span>
              <div>
                <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold">
                  Private notes
                  <Lock className="size-3.5 text-muted-foreground" aria-hidden />
                </h2>
                <p className="text-xs text-muted-foreground">
                  Visible only to your hiring team — never shown to candidates.
                </p>
              </div>
            </div>
            <StatusBadge status="active" variant="job" className="hidden sm:inline-flex" />
          </div>

          <div className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pipeline-notes-job">Job</Label>
              <Select value={notesJobId} onValueChange={setNotesJobId}>
                <SelectTrigger id="pipeline-notes-job" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={job.id}>{job.title}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              aria-label="Private hiring notes"
              rows={4}
              value={notesLoading ? "Loading notes…" : notes}
              disabled={notesLoading}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Interview impressions, salary discussions, team feedback…"
            />
            <Button onClick={() => void saveNotes()} disabled={notesLoading || notesSaving}>
              <Save aria-hidden />
              {notesSaving ? "Saving…" : "Save notes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

