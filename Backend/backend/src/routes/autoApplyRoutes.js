import { Router } from "express";
import { matchDisplayedJobs } from "../controllers/autoApplyController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();


router.post(
  "/match",
  requireAuth,
  (req, res, next) => req.app.locals.resumeUpload.single("resume")(req, res, next),
  matchDisplayedJobs,
);

export default router;
