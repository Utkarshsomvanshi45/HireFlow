import { Link } from "@tanstack/react-router";
import { MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { employmentTypeLabels, formatSalary, formatPosted } from "@/lib/format";
import type { Job } from "@/types";
import { cn } from "@/lib/utils";

export function JobCard({ job, className }: { job: Job; className?: string }) {
  const closed = job.status === "closed";

  return (
    <Link
      to="/jobs/$id"
      params={{ id: job.id }}
      className={cn(
        "group block rounded-xl border border-border bg-card transition-shadow duration-200 hover:card-shadow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-semibold text-accent-foreground"
            aria-hidden
          >
            {job.companyName.slice(0, 2).toUpperCase()}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {closed ? (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-transparent">
                Closed
              </Badge>
            ) : null}
            {job.remote ? (
              <Badge variant="outline" className="border-primary/25 bg-accent text-accent-foreground">
                <Sparkles className="size-3" aria-hidden />
                Remote
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground">{job.companyName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {job.location}
          </span>
          <span aria-hidden className="text-border">
            •
          </span>
          <span>{employmentTypeLabels[job.employmentType]}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
          <span className="text-sm font-medium text-foreground">{formatSalary(job)}</span>
          <span className="text-xs text-muted-foreground">{formatPosted(job.postedAt)}</span>
        </div>
      </CardContent>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-4 h-4 w-2/3" />
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
