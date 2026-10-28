import { Router } from "express";
import authRoutes from "./auth.routes.js";
import jobsRoutes from "./jobs.routes.js";
import applicationsRoutes from "./applications.routes.js";
import { listEmployerJobs } from "../controllers/jobs.controller.js";
import {
  listMyApplications,
  listEmployerApplications,
  applyToJob,
  applySchema,
  uploadCandidateResume,
} from "../controllers/applications.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { resumeUpload, validatePdfMagicBytes } from "../middlewares/upload.js";

const apiRouter = Router();

// Health check
apiRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "hireflow-api",
    timestamp: new Date().toISOString(),
  });
});

// Primary resources
apiRouter.use("/auth", authRoutes);
apiRouter.use("/jobs", jobsRoutes);
apiRouter.use("/applications", applicationsRoutes);

// Convenience REST aliases for frontend compatibility
apiRouter.get("/employer/jobs", requireAuth, requireRole("EMPLOYER"), listEmployerJobs);
apiRouter.get("/candidate/applications", requireAuth, requireRole("CANDIDATE"), listMyApplications);
apiRouter.get("/employer/applications", requireAuth, requireRole("EMPLOYER"), listEmployerApplications);
apiRouter.post(
  "/jobs/:id/applications",
  requireAuth,
  requireRole("CANDIDATE"),
  resumeUpload,
  validatePdfMagicBytes,
  (req, _res, next) => {
    // Inject jobId from route parameter if not in body
    if (!req.body.jobId && req.params.id) {
      req.body.jobId = req.params.id;
    }
    next();
  },
  validateBody(applySchema),
  applyToJob
);


apiRouter.post(
  "/candidate/resume",
  requireAuth,
  requireRole("CANDIDATE"),
  resumeUpload,
  validatePdfMagicBytes,
  uploadCandidateResume
);

export default apiRouter;

