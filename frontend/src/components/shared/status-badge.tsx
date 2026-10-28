import { Badge } from "@/components/ui/badge";
import { applicationStatusLabels, jobStatusLabels } from "@/lib/format";
import type { ApplicationStatus, JobStatus } from "@/types";
import { cn } from "@/lib/utils";

type Variant = "application" | "job";

const applicationStyles: Record<ApplicationStatus, string> = {
  applied: "bg-secondary text-secondary-foreground border-transparent",
  shortlisted: "bg-accent text-accent-foreground border-transparent",
  interview: "bg-warning/15 text-warning-foreground border-warning/30",
  hired: "bg-success/15 text-success-foreground border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/25",
};

const jobStyles: Record<JobStatus, string> = {
  active: "bg-success/15 text-success-foreground border-success/30",
  closed: "bg-muted text-muted-foreground border-transparent",
  draft: "bg-warning/15 text-warning-foreground border-warning/30",
};

export function StatusBadge({
  status,
  variant = "application",
  className,
}: {
  status: ApplicationStatus | JobStatus;
  variant?: Variant;
  className?: string;
}) {
  const style =
    variant === "job"
      ? jobStyles[status as JobStatus]
      : applicationStyles[status as ApplicationStatus];
  const label =
    variant === "job"
      ? jobStatusLabels[status as JobStatus]
      : applicationStatusLabels[status as ApplicationStatus];

  return (
    <Badge variant="outline" className={cn("font-medium", style, className)}>
      {label}
    </Badge>
  );
}
