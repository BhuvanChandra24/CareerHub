import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { matchDisplayedJobs } from "../controllers/autoApplyController.js";

const router = Router();
router.use(requireAuth);

router.post(
  "/match",
  (req, res, next) => {
    const upload = req.app.locals.resumeUpload;
    if (!upload) {
      return res.status(500).json({ message: "Resume upload middleware is not configured." });
    }
    upload.single("resume")(req, res, next);
  },
  matchDisplayedJobs,
);

export default router;
