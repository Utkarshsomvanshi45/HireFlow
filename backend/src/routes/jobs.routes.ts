import { Router } from "express";
import {
  listJobs,
  getJob,
  listRelatedJobs,
  listEmployerJobs,
  createJob,
  updateJob,
  updateJobStatus,
  jobInputSchema,
} from "../controllers/jobs.controller.js";
import {
  listApplicationsForJob,
  getPrivateNotes,
  savePrivateNotes,
  saveNotesSchema,
} from "../controllers/applications.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";

const router = Router();

// Public routes
router.get("/", listJobs);
router.get("/:id", getJob);
router.get("/:id/related", listRelatedJobs);

// Employer protected routes
router.post("/", requireAuth, requireRole("EMPLOYER"), validateBody(jobInputSchema), createJob);
router.patch("/:id", requireAuth, requireRole("EMPLOYER"), updateJob);
router.patch("/:id/status", requireAuth, requireRole("EMPLOYER"), updateJobStatus);

// Employer job applicant & private notes sub-routes
router.get("/:id/applications", requireAuth, requireRole("EMPLOYER"), listApplicationsForJob);
router.get("/:id/private-notes", requireAuth, requireRole("EMPLOYER"), getPrivateNotes);
router.put("/:id/private-notes", requireAuth, requireRole("EMPLOYER"), validateBody(saveNotesSchema), savePrivateNotes);

export default router;

