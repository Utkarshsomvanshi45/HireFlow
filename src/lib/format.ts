import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";
import type { ApplicationStatus, EmploymentType, Job, JobStatus } from "@/types";

export const employmentTypeLabels: Record<EmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
};

export const employmentTypeOptions = (Object.keys(employmentTypeLabels) as EmploymentType[]).map(
  (value) => ({ value, label: employmentTypeLabels[value] }),
);

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  active: "Active",
  closed: "Closed",
  draft: "Draft",
};

export function formatSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "currency">): string {
  if (!job.salaryMin && !job.salaryMax) return "Salary not disclosed";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.currency || "USD",
    maximumFractionDigits: 0,
  });
  if (job.salaryMin && job.salaryMax) {
    return `${formatter.format(job.salaryMin)} – ${formatter.format(job.salaryMax)}`;
  }
  return `From ${formatter.format((job.salaryMin ?? job.salaryMax)!)} a year`;
}

export function formatPosted(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return format(parseISO(iso), "d MMM yyyy");
  }
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy");
}

export function postedDaysAgo(iso: string): number {
  return Math.abs(differenceInCalendarDays(new Date(), parseISO(iso)));
}
