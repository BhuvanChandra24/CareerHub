import { Router } from "express";
import { createApplication } from "../controllers/applicationController.js";
import { optionalAuth } from "../middleware/auth.js";
const router = Router();
router.post(
  "/",
  optionalAuth,
  (req, res, next) =>
    req.app.locals.applicationUpload.single("resume")(req, res, next),
  createApplication,
);
export default router;
