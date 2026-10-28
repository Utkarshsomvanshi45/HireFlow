import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { JobForm } from "@/components/employer/job-form";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { useSession } from "@/hooks/use-session";
import { createJob } from "@/services/jobs.service";
import type { JobInput, JobStatus } from "@/types";

export function EmployerNewJobPage() {
  const navigate = useNavigate();
  const session = useSession();

  useEffect(() => {
    document.title = "Post a Job — HireFlow";
  }, []);

  return (
    <>
      <PageHeading
        title="Post a job"
        description="Give candidates everything they need to decide — description, responsibilities and pay."
        actions={
          <Button variant="ghost" asChild>
            <Link to="/employer/jobs">Back to jobs</Link>
          </Button>
        }
      />

      <JobForm
        defaultCompanyName={session === "loading" || session === null ? undefined : session.user.companyName}
        onCancel={() => navigate("/employer/jobs")}
        onSubmit={async (input: JobInput, status: JobStatus) => {
          const job = await createJob(input, 0);
          toast.success(
            status === "draft" ? "Draft saved" : "Job published",
            { description: status === "draft" ? "Publish it when you're ready." : "Candidates can apply now." },
          );
          navigate("/employer/jobs");
          return job;
        }}
      />
    </>
  );
}

