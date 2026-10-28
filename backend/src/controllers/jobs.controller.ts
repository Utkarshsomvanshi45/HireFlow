import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import { JobStatus, type Job as PrismaJob, Prisma } from "@prisma/client";

export const jobInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  companyName: z.string().min(1, "Company name is required").max(100),
  location: z.string().min(1, "Location is required").max(100),
  remote: z.boolean().default(false),
  employmentType: z.string().default("full-time"),
  currency: z.string().default("USD"),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  description: z.string().min(1, "Description is required"),
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(["active", "closed", "draft", "OPEN", "CLOSED", "DRAFT"]).default("active"),
}).refine(
  (data) => {
    if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
      return data.salaryMin <= data.salaryMax;
    }
    return true;
  },
  { message: "Minimum salary cannot exceed maximum salary", path: ["salaryMin"] }
);

function mapDbStatusToFrontend(status: JobStatus): "active" | "closed" | "draft" {
  if (status === JobStatus.OPEN) return "active";
  if (status === JobStatus.CLOSED) return "closed";
  return "draft";
}

function mapFrontendStatusToDb(status: string): JobStatus {
  const normalized = status.toLowerCase();
  if (normalized === "active" || normalized === "open") return JobStatus.OPEN;
  if (normalized === "closed") return JobStatus.CLOSED;
  return JobStatus.DRAFT;
}

export function toSafeJob(job: PrismaJob & { _count?: { applications?: number } }) {
  return {
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    remote: job.remote,
    employmentType: job.employmentType as any,
    currency: job.currency,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    postedAt: job.createdAt.toISOString().slice(0, 10),
    status: mapDbStatusToFrontend(job.status),
    description: job.description,
    responsibilities: job.responsibilities,
    qualifications: job.qualifications,
    tags: job.tags,
    applicantCount: job._count?.applications ?? 0,
  };
}

export async function listJobs(req: Request, res: Response): Promise<void> {
  const { q, location, employmentType, company, sort, page, limit } = req.query;

  const where: Prisma.JobWhereInput = {
    status: JobStatus.OPEN,
  };

  if (company && typeof company === "string") {
    // If company is specified, allow employer query matching company
    where.companyName = { equals: company, mode: "insensitive" };
    // If explicitly searching company jobs, don't restrict only to OPEN
    delete where.status;
  }

  if (location && typeof location === "string" && location.trim()) {
    where.location = { contains: location.trim(), mode: "insensitive" };
  }

  if (employmentType && typeof employmentType === "string" && employmentType !== "all") {
    where.employmentType = employmentType;
  }

  if (q && typeof q === "string" && q.trim()) {
    const keyword = q.trim();
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { companyName: { contains: keyword, mode: "insensitive" } },
      { tags: { has: keyword } },
    ];
  }

  let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "salary") {
    orderBy = { salaryMax: "desc" };
  } else if (sort === "company") {
    orderBy = { companyName: "asc" };
  }

  const take = limit ? Math.min(parseInt(limit as string, 10) || 50, 100) : 100;
  const skip = page ? ((parseInt(page as string, 10) || 1) - 1) * take : 0;

  const [jobs] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    }),
  ]);

  res.status(200).json(jobs.map(toSafeJob));
}

export async function getJob(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  if (!job) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  res.status(200).json(toSafeJob(job));
}

export async function listRelatedJobs(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const currentJob = await prisma.job.findUnique({ where: { id } });
  if (!currentJob) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  const related = await prisma.job.findMany({
    where: {
      id: { not: id },
      status: JobStatus.OPEN,
      OR: [
        { companyName: currentJob.companyName },
        { employmentType: currentJob.employmentType },
        { tags: { hasSome: currentJob.tags } },
      ],
    },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  });

  res.status(200).json(related.map(toSafeJob));
}

export async function listEmployerJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const jobs = await prisma.job.findMany({
    where: { employerId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  });

  res.status(200).json(jobs.map(toSafeJob));
}

export async function createJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const input = req.body;
  const dbStatus = mapFrontendStatusToDb(input.status ?? "active");

  const job = await prisma.job.create({
    data: {
      employerId: req.user.id,
      title: input.title,
      companyName: req.user.companyName || input.companyName,
      location: input.location,
      remote: input.remote ?? false,
      employmentType: input.employmentType,
      currency: input.currency ?? "USD",
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      description: input.description,
      responsibilities: input.responsibilities ?? [],
      qualifications: input.qualifications ?? [],
      tags: input.tags ?? [],
      status: dbStatus,
    },
    include: {
      _count: { select: { applications: true } },
    },
  });

  res.status(201).json(toSafeJob(job));
}

export async function updateJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  if (existing.employerId !== req.user.id) {
    res.status(403).json({ message: "You can only edit your own listings." });
    return;
  }

  const input = req.body;
  const data: Prisma.JobUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.companyName !== undefined) data.companyName = input.companyName;
  if (input.location !== undefined) data.location = input.location;
  if (input.remote !== undefined) data.remote = input.remote;
  if (input.employmentType !== undefined) data.employmentType = input.employmentType;
  if (input.salaryMin !== undefined) data.salaryMin = input.salaryMin;
  if (input.salaryMax !== undefined) data.salaryMax = input.salaryMax;
  if (input.description !== undefined) data.description = input.description;
  if (input.responsibilities !== undefined) data.responsibilities = input.responsibilities;
  if (input.qualifications !== undefined) data.qualifications = input.qualifications;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.status !== undefined) data.status = mapFrontendStatusToDb(input.status);

  const updated = await prisma.job.update({
    where: { id },
    data,
    include: {
      _count: { select: { applications: true } },
    },
  });

  res.status(200).json(toSafeJob(updated));
}

export async function updateJobStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  if (existing.employerId !== req.user.id) {
    res.status(403).json({ message: "You can only update status for your own listings." });
    return;
  }

  const dbStatus = mapFrontendStatusToDb(status);
  const updated = await prisma.job.update({
    where: { id },
    data: { status: dbStatus },
    include: {
      _count: { select: { applications: true } },
    },
  });

  res.status(200).json(toSafeJob(updated));
}

