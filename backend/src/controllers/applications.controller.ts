import { z } from "zod";
import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { storageService } from "../services/storage.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import { toSafeUser } from "./auth.controller.js";
import {
  ApplicationStatus,
  JobStatus,
  type Application as PrismaApplication,
  type Job as PrismaJob,
} from "@prisma/client";

export const applySchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  candidateTitle: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["applied", "shortlisted", "interview", "hired", "rejected", "APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"]),
});

export const saveNotesSchema = z.object({
  notes: z.string(),
});

function mapDbAppStatusToFrontend(status: ApplicationStatus): "applied" | "shortlisted" | "interview" | "hired" | "rejected" {
  return status.toLowerCase() as any;
}

function mapFrontendAppStatusToDb(status: string): ApplicationStatus {
  const normalized = status.toUpperCase();
  if (normalized in ApplicationStatus) {
    return normalized as ApplicationStatus;
  }
  return ApplicationStatus.APPLIED;
}

export function toSafeApplication(app: PrismaApplication & { job?: PrismaJob }) {
  return {
    id: app.id,
    jobId: app.jobId,
    candidateId: app.candidateId,
    candidateName: app.candidateName,
    candidateEmail: app.candidateEmail,
    candidateTitle: app.candidateTitle ?? undefined,
    appliedAt: app.createdAt.toISOString().slice(0, 10),
    status: mapDbAppStatusToFrontend(app.status),
    resumeAvailable: app.resumeAvailable,
    resumeName: app.resumeName ?? undefined,
    job: app.job
      ? {
          id: app.job.id,
          title: app.job.title,
          companyName: app.job.companyName,
          location: app.job.location,
          status: app.job.status.toLowerCase(),
        }
      : undefined,
  };
}

export async function applyToJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "CANDIDATE") {
    res.status(403).json({ message: "Only candidates can apply to jobs." });
    return;
  }

  const { jobId, candidateTitle } = req.body;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  if (job.status === JobStatus.CLOSED) {
    res.status(400).json({ message: "This position is closed and no longer accepting applications." });
    return;
  }

  // Check duplicate application
  const existing = await prisma.application.findUnique({
    where: {
      jobId_candidateId: {
        jobId,
        candidateId: req.user.id,
      },
    },
  });

  if (existing) {
    res.status(400).json({ message: "You have already applied to this job." });
    return;
  }

  let resumeName = req.user.resumeName || undefined;
  let resumeUrl: string | undefined = undefined;
  let resumeAvailable = Boolean(req.user.resumeName);

  // If a file was attached with the application
  if (req.file) {
    const stored = await storageService.save(req.file, req.user.id);
    resumeName = stored.filename;
    resumeUrl = stored.key;
    resumeAvailable = true;
  } else {
    // Look up the candidate's latest uploaded resume in storage
    if (storageService.findLatestKeyForOwner) {
      const latestKey = await storageService.findLatestKeyForOwner(req.user.id);
      if (latestKey) {
        resumeUrl = latestKey;
        resumeAvailable = true;
      }
    }
    if (!resumeUrl) {
      const prev = await prisma.application.findFirst({
        where: { candidateId: req.user.id, resumeUrl: { not: null } },
        orderBy: { updatedAt: "desc" },
      });
      if (prev?.resumeUrl) {
        resumeUrl = prev.resumeUrl;
        resumeAvailable = true;
      }
    }
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      candidateId: req.user.id,
      candidateName: req.user.name,
      candidateEmail: req.user.email,
      candidateTitle: candidateTitle || req.user.title || undefined,
      status: ApplicationStatus.APPLIED,
      resumeName,
      resumeUrl,
      resumeAvailable,
    },
    include: {
      job: true,
    },
  });

  res.status(201).json(toSafeApplication(application));
}

export async function listMyApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "CANDIDATE") {
    res.status(403).json({ message: "Candidate access required." });
    return;
  }

  const applications = await prisma.application.findMany({
    where: { candidateId: req.user.id },
    include: { job: true },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(applications.map(toSafeApplication));
}

export async function listApplicationsForJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params; // jobId

  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  if (job.employerId !== req.user.id) {
    res.status(403).json({ message: "You can only view applicants for your own listings." });
    return;
  }

  const applications = await prisma.application.findMany({
    where: { jobId: id },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(applications.map(toSafeApplication));
}

export async function listEmployerApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const applications = await prisma.application.findMany({
    where: {
      job: {
        employerId: req.user.id,
      },
    },
    include: { job: true },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(applications.map(toSafeApplication));
}

export async function updateApplicationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Only employers can update application statuses." });
    return;
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!application) {
    res.status(404).json({ message: "Application not found." });
    return;
  }

  if (application.job.employerId !== req.user.id) {
    res.status(403).json({ message: "You can only manage applications for your own listings." });
    return;
  }

  const dbStatus = mapFrontendAppStatusToDb(status);

  const updated = await prisma.application.update({
    where: { id },
    data: { status: dbStatus },
    include: { job: true },
  });

  res.status(200).json(toSafeApplication(updated));
}

export async function getPrivateNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params; // jobId

  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  if (job.employerId !== req.user.id) {
    res.status(403).json({ message: "You can only view private notes for your own jobs." });
    return;
  }

  const note = await prisma.applicationNote.findFirst({
    where: { jobId: id, employerId: req.user.id },
    orderBy: { updatedAt: "desc" },
  });

  res.status(200).json({ notes: note?.content ?? "" });
}

export async function savePrivateNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params; // jobId
  const { notes } = req.body;

  if (!req.user || req.user.role !== "EMPLOYER") {
    res.status(403).json({ message: "Employer access required." });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ message: "Job not found." });
    return;
  }

  if (job.employerId !== req.user.id) {
    res.status(403).json({ message: "You can only save private notes for your own jobs." });
    return;
  }

  const existing = await prisma.applicationNote.findFirst({
    where: { jobId: id, employerId: req.user.id },
  });

  if (existing) {
    await prisma.applicationNote.update({
      where: { id: existing.id },
      data: { content: notes },
    });
  } else {
    await prisma.applicationNote.create({
      data: {
        jobId: id,
        employerId: req.user.id,
        content: notes,
      },
    });
  }

  res.status(200).json({ message: "Private notes saved successfully." });
}

export async function downloadResume(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params; // applicationId

  if (!req.user) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!application) {
    res.status(404).json({ message: "Application not found." });
    return;
  }

  const isOwnerCandidate = req.user.id === application.candidateId;
  const isJobEmployer = req.user.id === application.job.employerId;

  if (!isOwnerCandidate && !isJobEmployer) {
    res.status(403).json({ message: "You are not authorized to access this resume." });
    return;
  }

  let resumeKey = application.resumeUrl;
  let resumeFilename = application.resumeName;

  // 1. If not set directly on this application, find the latest uploaded resume key for this candidate
  if (!resumeKey && storageService.findLatestKeyForOwner) {
    const foundKey = await storageService.findLatestKeyForOwner(application.candidateId);
    if (foundKey) {
      resumeKey = foundKey;
    }
  }

  // 2. If still not set, check other applications by this candidate
  if (!resumeKey) {
    const candidateApp = await prisma.application.findFirst({
      where: {
        candidateId: application.candidateId,
        resumeUrl: { not: null },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (candidateApp?.resumeUrl) {
      resumeKey = candidateApp.resumeUrl;
      resumeFilename = candidateApp.resumeName || resumeFilename;
    }
  }

  // Save the resolved key back to this application for fast future downloads
  if (resumeKey && (!application.resumeUrl || application.resumeUrl !== resumeKey)) {
    await prisma.application.update({
      where: { id: application.id },
      data: {
        resumeUrl: resumeKey,
        resumeName: resumeFilename || application.resumeName || "resume.pdf",
        resumeAvailable: true,
      },
    }).catch(() => {});
  }

  if (!resumeKey) {
    res.status(404).json({ message: "No resume attached. The candidate has not uploaded a resume file." });
    return;
  }

  if (storageService.getDownloadUrl) {
    const signedUrl = await storageService.getDownloadUrl(resumeKey).catch(() => null);
    if (signedUrl) {
      res.redirect(signedUrl);
      return;
    }
  }

  const fileBuffer = await storageService.read(resumeKey);
  if (!fileBuffer) {
    res.status(404).json({ message: "Resume file is missing from storage." });
    return;
  }

  const safeFilename = (resumeFilename || application.resumeName || "resume.pdf").replace(/[^\w.-]/g, "_");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
  res.send(fileBuffer);
}

export async function deleteApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!application) {
    res.status(404).json({ message: "Application not found." });
    return;
  }

  const isCandidateOwner = req.user.role === "CANDIDATE" && req.user.id === application.candidateId;
  const isJobEmployer = req.user.role === "EMPLOYER" && req.user.id === application.job.employerId;

  if (!isCandidateOwner && !isJobEmployer) {
    res.status(403).json({ message: "You are not authorized to delete this application." });
    return;
  }

  await prisma.application.delete({
    where: { id },
  });

  res.status(200).json({ message: "Application deleted successfully." });
}

export async function uploadCandidateResume(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "CANDIDATE") {
    res.status(403).json({ message: "Candidate access required." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "Please provide a valid PDF file." });
    return;
  }

  const stored = await storageService.save(req.file, req.user.id);

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      resumeName: stored.filename,
      resumeUpdatedAt: new Date(),
    },
  });

  // Also backfill this resume to candidate's existing applications
  await prisma.application.updateMany({
    where: { candidateId: req.user.id },
    data: {
      resumeName: stored.filename,
      resumeUrl: stored.key,
      resumeAvailable: true,
    },
  }).catch(() => {});

  res.status(200).json({
    message: "Resume uploaded successfully.",
    resumeName: updatedUser.resumeName,
    resumeUpdatedAt: updatedUser.resumeUpdatedAt?.toISOString().slice(0, 10),
    user: toSafeUser(updatedUser),
  });
}

