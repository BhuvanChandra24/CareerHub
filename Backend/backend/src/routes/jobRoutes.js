import { Router } from "express";
import { listJobs } from "../controllers/jobsController.js";
const router = Router();
router.get("/", listJobs);
export default router;
