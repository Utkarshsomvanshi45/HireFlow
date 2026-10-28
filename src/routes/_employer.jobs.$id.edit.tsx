import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { JobForm } from "@/components/employer/job-form";
import { ErrorState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { getJob, updateJob } from "@/services/jobs.service";
import type { Job, JobInput, JobStatus } from "@/types";

export const Route = createFileRoute("/_employer/jobs/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Job — HireFlow" },
      { name: "description", content: "Edit a job listing on HireFlow." },
    ],
  }),
  component: EditJobPage,
});

function EditJobPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const session = useSession();

  const [job, setJob] = useState<Job | null | "error">(null);

  useEffect(() => {
    let active = true;
    getJob(id)
      .then((result) => active && setJob(result ?? "error"))
      .catch(() => active && setJob("error"));
    return () => {
      active = false;
    };
  }, [id]);

  if (job === "error" || job === null) {
    return (
      <ErrorState
        title={job === "error" ? "Job couldn't load" : "Loading job…"}
        description={job === "error" ? "This listing may have been removed." : undefined}
        onRetry={job === "error" ? () => setJob(null) : undefined}
      />
    );
  }

  const company = session === "loading" || session === null ? undefined : session.user.companyName;
  if (company && job.companyName !== company) {
    return (
      <ErrorState
        title="This job belongs to another company"
        description="You can only edit listings published by your own company."
      />
    );
  }

  return (
    <>
      <PageHeading
        title={`Edit: ${job.title}`}
        description={`Posted ${job.postedAt} · ${job.location}`}
        actions={
          <Button variant="ghost" asChild>
            <Link to="/employer/jobs">Back to jobs</Link>
          </Button>
        }
      />

      <JobForm
        job={job}
        onCancel={() => navigate({ to: "/employer/jobs" })}
        onSubmit={async (input: JobInput, status: JobStatus) => {
          await updateJob(job.id, { ...input, status });
          toast.success("Changes saved");
          await navigate({ to: "/employer/jobs" });
        }}
      />
    </>
  );
}
