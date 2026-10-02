import { Router } from "express";
import {
  createApplication,
  listMyApplications,
  getMyApplication,
  updateMyApplication,
} from "../controllers/applicationController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/mine", listMyApplications);
router.get("/mine/:id", getMyApplication);
router.patch("/mine/:id", updateMyApplication);
router.post(
  "/",
  (req, res, next) =>
    req.app.locals.applicationUpload.single("resume")(req, res, next),
  createApplication,
);
export default router;
