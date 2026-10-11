import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { matchDisplayedJobs } from "../controllers/autoApplyController.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/match",
  (req, res, next) =>
    req.app.locals.resumeUpload.single("resume")(req, res, next),
  matchDisplayedJobs,
);

export default router;
