import { Router } from "express";
import { analyze, matchJobs } from "../controllers/resumeController.js";
const router = Router();
router.post("/analyze", (req, res, next) => req.app.locals.resumeUpload.single("resume")(req, res, next), analyze);
router.post("/match-jobs", (req, res, next) => req.app.locals.resumeUpload.single("resume")(req, res, next), matchJobs);
export default router;
