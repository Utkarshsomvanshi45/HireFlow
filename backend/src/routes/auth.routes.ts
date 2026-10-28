import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.patch("/profile", requireAuth, validateBody(updateProfileSchema), updateProfile);

export default router;

