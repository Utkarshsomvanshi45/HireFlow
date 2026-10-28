import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employmentTypeOptions } from "@/lib/format";
import type { EmploymentType, Job, JobInput, JobStatus } from "@/types";

/**
 * Shared create/edit job form used by the employer dashboard. Validation is
 * inline and accessible: every control has a label, errors are announced via
 * aria-invalid + aria-describedby, and messages sit under each field.
 */

interface FormValues {
  title: string;
  companyName: string;
  location: string;
  remote: boolean;
  employmentType: EmploymentType;
  salaryMin: string;
  salaryMax: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  tags: string;
}

interface FormErrors {
  title?: string;
  companyName?: string;
  location?: string;
  description?: string;
  salary?: string;
}

function toFormValues(job?: Job): FormValues {
  return {
    title: job?.title ?? "",
    companyName: job?.companyName ?? "",
    location: job?.location ?? "",
    remote: job?.remote ?? false,
    employmentType: job?.employmentType ?? "full-time",
    salaryMin: job?.salaryMin !== undefined ? String(job.salaryMin) : "",
    salaryMax: job?.salaryMax !== undefined ? String(job.salaryMax) : "",
    description: job?.description ?? "",
    responsibilities: job?.responsibilities.join("\n") ?? "",
    qualifications: job?.qualifications.join("\n") ?? "",
    tags: job?.tags.join(", ") ?? "",
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.title.trim()) errors.title = "Job title is required.";
  if (!values.companyName.trim()) errors.companyName = "Company name is required.";
  if (!values.location.trim()) errors.location = "Location is required.";
  if (!values.description.trim()) errors.description = "Job description is required.";

  const min = values.salaryMin ? Number(values.salaryMin) : undefined;
  const max = values.salaryMax ? Number(values.salaryMax) : undefined;
  if ((values.salaryMin && Number.isNaN(min)) || (values.salaryMax && Number.isNaN(max))) {
    errors.salary = "Salary values must be numbers.";
  } else if (min !== undefined && max !== undefined && min > max) {
    errors.salary = "Minimum salary cannot exceed the maximum.";
  }
  return errors;
}

function toJobInput(values: FormValues, status: JobStatus): JobInput {
  const splitLines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  return {
    title: values.title.trim(),
    companyName: values.companyName.trim(),
    location: values.location.trim(),
    remote: values.remote,
    employmentType: values.employmentType,
    currency: "USD",
    salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
    salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
    description: values.description.trim(),
    responsibilities: splitLines(values.responsibilities),
    qualifications: splitLines(values.qualifications),
    tags: values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status,
  };
}

const inputErrorClass = "border-destructive focus-visible:ring-destructive";

export function JobForm({
  job,
  defaultCompanyName,
  onSubmit,
  onCancel,
}: {
  job?: Job;
  defaultCompanyName?: string;
  /** Receives the parsed job input plus the requested status. */
  onSubmit: (input: JobInput, status: JobStatus) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<FormValues>(() => {
    const initial = toFormValues(job);
    if (!initial.companyName && defaultCompanyName) initial.companyName = defaultCompanyName;
    return initial;
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<JobStatus | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key === "salaryMin" || key === "salaryMax" ? "salary" : key]: undefined }));
  };

  const submit = async (status: JobStatus) => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(status);
    setApiError(null);
    try {
      await onSubmit(toJobInput(values, status), status);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not save the job. Try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const fieldId = (name: string) => `job-${name}`;

  return (
    <form
      className="space-y-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit(job?.status === "draft" ? "draft" : "active");
      }}
    >
      <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Role basics</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("title")}>Job title *</Label>
            <Input
              id={fieldId("title")}
              value={values.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${fieldId("title")}-error` : undefined}
              className={errors.title ? inputErrorClass : undefined}
            />
            {errors.title ? (
              <p id={`${fieldId("title")}-error`} role="alert" className="text-xs font-medium text-destructive">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId("companyName")}>Company name *</Label>
            <Input
              id={fieldId("companyName")}
              value={values.companyName}
              onChange={(event) => update("companyName", event.target.value)}
              placeholder="e.g. Northwind Labs"
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={errors.companyName ? `${fieldId("companyName")}-error` : undefined}
              className={errors.companyName ? inputErrorClass : undefined}
            />
            {errors.companyName ? (
              <p id={`${fieldId("companyName")}-error`} role="alert" className="text-xs font-medium text-destructive">
                {errors.companyName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("location")}>Location *</Label>
            <Input
              id={fieldId("location")}
              value={values.location}
              onChange={(event) => update("location", event.target.value)}
              placeholder="e.g. Berlin, Germany"
              aria-invalid={Boolean(errors.location)}
              aria-describedby={errors.location ? `${fieldId("location")}-error` : undefined}
              className={errors.location ? inputErrorClass : undefined}
            />
            {errors.location ? (
              <p id={`${fieldId("location")}-error`} role="alert" className="text-xs font-medium text-destructive">
                {errors.location}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId("employmentType")}>Employment type *</Label>
            <Select
              value={values.employmentType}
              onValueChange={(value) => update("employmentType", value as EmploymentType)}
            >
              <SelectTrigger id={fieldId("employmentType")} className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {employmentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Checkbox
            id={fieldId("remote")}
            checked={values.remote}
            onCheckedChange={(checked) => update("remote", checked === true)}
          />
          <Label htmlFor={fieldId("remote")} className="cursor-pointer text-sm font-normal">
            This role can be worked remotely
          </Label>
        </div>

        <div className="space-y-2">
          <Label>Salary range (optional, USD per year)</Label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              id={fieldId("salaryMin")}
              inputMode="numeric"
              value={values.salaryMin}
              onChange={(event) => update("salaryMin", event.target.value)}
              placeholder="Min, e.g. 70000"
              aria-label="Minimum yearly salary in US dollars"
              aria-invalid={Boolean(errors.salary)}
              aria-describedby={errors.salary ? `${fieldId("salaryMin")}-error` : undefined}
              className={errors.salary ? inputErrorClass : undefined}
            />
            <Input
              id={fieldId("salaryMax")}
              inputMode="numeric"
              value={values.salaryMax}
              onChange={(event) => update("salaryMax", event.target.value)}
              placeholder="Max, e.g. 110000"
              aria-label="Maximum yearly salary in US dollars"
              aria-invalid={Boolean(errors.salary)}
              aria-describedby={errors.salary ? `${fieldId("salaryMax")}-error` : undefined}
              className={errors.salary ? inputErrorClass : undefined}
            />
          </div>
          {errors.salary ? (
            <p id={`${fieldId("salaryMin")}-error`} role="alert" className="text-xs font-medium text-destructive">
              {errors.salary}
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Details</h2>

        <div className="space-y-2">
          <Label htmlFor={fieldId("description")}>Job description *</Label>
          <Textarea
            id={fieldId("description")}
            rows={5}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Describe the role, the team and what success looks like."
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? `${fieldId("description")}-error` : undefined}
            className={errors.description ? inputErrorClass : undefined}
          />
          {errors.description ? (
            <p id={`${fieldId("description")}-error`} role="alert" className="text-xs font-medium text-destructive">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("responsibilities")}>Responsibilities</Label>
            <Textarea
              id={fieldId("responsibilities")}
              rows={5}
              value={values.responsibilities}
              onChange={(event) => update("responsibilities", event.target.value)}
              placeholder={"One per line, e.g.\nShip features in React and TypeScript"}
            />
            <p className="text-xs text-muted-foreground">One item per line.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId("qualifications")}>Qualifications</Label>
            <Textarea
              id={fieldId("qualifications")}
              rows={5}
              value={values.qualifications}
              onChange={(event) => update("qualifications", event.target.value)}
              placeholder={"One per line, e.g.\n6+ years of frontend experience"}
            />
            <p className="text-xs text-muted-foreground">One item per line.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("tags")}>Skills / tags</Label>
          <Input
            id={fieldId("tags")}
            value={values.tags}
            onChange={(event) => update("tags", event.target.value)}
            placeholder="Comma separated, e.g. React, TypeScript, Design Systems"
          />
        </div>
      </section>

      {apiError ? (
        <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {apiError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
        <Button type="submit" disabled={submitting !== null}>
          {submitting === "active" ? "Publishing…" : job ? "Save changes" : "Publish job"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting !== null}
          onClick={() => void submit("draft")}
        >
          {submitting === "draft" ? "Saving…" : "Save as draft"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} className="sm:ml-auto">
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
