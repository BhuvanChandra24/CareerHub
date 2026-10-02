import { Router } from "express";
import { signup, signin, me, googleSignin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google", googleSignin);
router.get("/me", requireAuth, me);
export default router;
