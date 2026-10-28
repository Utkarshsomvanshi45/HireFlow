import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JobCard, JobCardSkeleton } from "@/components/jobs/job-card";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employmentTypeOptions } from "@/lib/format";
import { listJobs } from "@/services/jobs.service";
import type { EmploymentType, Job } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";

export const Route = createFileRoute("/jobs/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
    location: typeof search.location === "string" ? search.location : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse Jobs — HireFlow" },
      {
        name: "description",
        content:
          "Search open roles by title, company, keyword and location. Filter by employment type and sort by recency or salary.",
      },
      { property: "og:title", content: "Browse Jobs — HireFlow" },
      {
        property: "og:description",
        content: "Search open roles by title, company, keyword and location.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobsPage,
});

const PAGE_SIZE = 6;

type SortKey = "newest" | "salary" | "company";

function JobsPage() {
  const search = Route.useSearch();
  const [allJobs, setAllJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [keyword, setKeyword] = useState(search.q ?? "");
  const [location, setLocation] = useState(search.location ?? "");
  const [employmentType, setEmploymentType] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    setAllJobs(null);
    setError(null);
    listJobs()
      .then((jobs) => {
        if (active) setAllJobs(jobs);
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "Jobs could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    if (!allJobs) return [];
    const needle = keyword.trim().toLowerCase();
    const where = location.trim().toLowerCase();

    const matches = allJobs.filter((job) => {
      if (needle) {
        const haystack = [job.title, job.companyName, job.location, ...job.tags]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (where && !job.location.toLowerCase().includes(where)) return false;
      if (employmentType !== "all" && job.employmentType !== employmentType) return false;
      return true;
    });

    switch (sort) {
      case "salary":
        return matches.sort(
          (a, b) => (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0),
        );
      case "company":
        return matches.sort((a, b) => a.companyName.localeCompare(b.companyName));
      default:
        return matches.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    }
  }, [allJobs, keyword, location, employmentType, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasFilters = keyword.trim() || location.trim() || employmentType !== "all";

  const clearFilters = () => {
    setKeyword("");
    setLocation("");
    setEmploymentType("all");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Browse jobs
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Search by title, company or keyword, then narrow by location and type.
          </p>

          {/* Filters */}
          <form
            className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_auto] card-shadow"
            role="search"
            aria-label="Job filters"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="space-y-1.5">
              <Label htmlFor="job-keyword">Keyword</Label>
              <Input
                id="job-keyword"
                placeholder="Title, company or skill"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-location">Location</Label>
              <Input
                id="job-location"
                placeholder="e.g. Berlin or Remote"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-type">Employment type</Label>
              <Select
                value={employmentType}
                onValueChange={(value) => {
                  setEmploymentType(value);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <SelectTrigger id="job-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {employmentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-sort">Sort by</Label>
              <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                <SelectTrigger id="job-sort" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="salary">Salary: high to low</SelectItem>
                  <SelectItem value="company">Company A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
            {allJobs
              ? `${filtered.length} ${filtered.length === 1 ? "job" : "jobs"} found`
              : "Loading jobs…"}
          </p>

          <div className="mt-4">
            {error ? (
              <ErrorState
                title="Jobs couldn't load"
                description={error}
                onRetry={() => setReloadKey((key) => key + 1)}
              />
            ) : allJobs === null ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <JobCardSkeleton key={index} />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No jobs match your search"
                description="Try a different keyword, widen the location, or clear the filters to see everything that's open."
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                {visibleCount < filtered.length ? (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    >
                      Load more jobs
                      <span className="text-muted-foreground">
                        ({filtered.length - visibleCount} remaining)
                      </span>
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Keeps expectations clear without cluttering the cards */}
          {allJobs && visible.length > 0 ? (
            <p className="mt-10 text-xs text-muted-foreground">
              Salary ranges are yearly figures in USD. Some roles may close
              without notice.
            </p>
          ) : null}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
