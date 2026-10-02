import { Router } from "express";
import {
  signup,
  signin,
  me,
  googleSignin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google", googleSignin);
router.get("/me", requireAuth, me);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
