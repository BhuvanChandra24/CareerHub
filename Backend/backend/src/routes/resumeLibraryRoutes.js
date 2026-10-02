import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { planLimit } from "../middleware/planLimits.js";
import {
  listResumes,
  uploadResume,
  renameResume,
  setDefaultResume,
  addResumeVersion,
  compareResumes,
  deleteResume,
} from "../controllers/resumeLibraryController.js";

const router = Router();
router.use(requireAuth);

const upload = (req, res, next) =>
  req.app.locals.resumeUpload.single("resume")(req, res, next);

router.get("/", listResumes);
router.post("/", planLimit("resumes"), upload, uploadResume);
router.patch("/:id", renameResume);
router.post("/:id/default", setDefaultResume);
router.post("/:id/versions", upload, addResumeVersion);
router.get("/compare", compareResumes);
router.delete("/:id", deleteResume);

export default router;
