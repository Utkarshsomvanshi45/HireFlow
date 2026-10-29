import { Router } from "express";
import {
  applyToJob,
  deleteApplication,
  listMyApplications,
  listEmployerApplications,
  updateApplicationStatus,
  downloadResume,
  uploadCandidateResume,
  applySchema,
  updateStatusSchema,
} from "../controllers/applications.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { resumeUpload, validatePdfMagicBytes } from "../middlewares/upload.js";

const router = Router();

// Candidate endpoints
router.post(
  "/",
  requireAuth,
  requireRole("CANDIDATE"),
  resumeUpload,
  validatePdfMagicBytes,
  validateBody(applySchema),
  applyToJob
);
router.get("/me", requireAuth, requireRole("CANDIDATE"), listMyApplications);
router.post(
  "/resume",
  requireAuth,
  requireRole("CANDIDATE"),
  resumeUpload,
  validatePdfMagicBytes,
  uploadCandidateResume
);

// Employer endpoints
router.get("/", requireAuth, requireRole("EMPLOYER"), listEmployerApplications);
router.patch("/:id/status", requireAuth, requireRole("EMPLOYER"), validateBody(updateStatusSchema), updateApplicationStatus);

// Resume download (authorized candidate or employer)
router.get("/:id/resume", requireAuth, downloadResume);

// Delete application (candidate withdraws or employer deletes applicant)
router.delete("/:id", requireAuth, deleteApplication);

export default router;

