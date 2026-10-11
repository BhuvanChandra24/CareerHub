import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { matchDisplayedJobs } from "../controllers/autoApplyController.js";

const router = Router();

// Authenticate before accepting an uploaded resume.
router.use(requireAuth);

// POST /api/applications/auto-apply/match
// The router is mounted at /api/applications/auto-apply in server.js.
router.post(
  "/match",
  (req, res, next) =>
    req.app.locals.resumeUpload.single("resume")(req, res, next),
  matchDisplayedJobs,
);

export default router;
