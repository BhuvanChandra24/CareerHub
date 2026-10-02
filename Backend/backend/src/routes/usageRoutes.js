import { Router } from "express";
import User from "../models/User.js";
import UsageEvent from "../models/UsageEvent.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
const periodKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

router.get("/summary", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "subscriptionPlan subscriptionStatus infoUsage infoUsagePeriod",
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    const period = periodKey();
    const infoUsage =
      user.infoUsagePeriod === period ? Number(user.infoUsage || 0) : 0;
    const events = await UsageEvent.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({
      infoUsage,
      infoLimit: user.subscriptionPlan === "free" ? 5 : null,
      plan: user.subscriptionPlan || "free",
      events,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/consume", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "subscriptionPlan infoUsage infoUsagePeriod",
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    const period = periodKey();
    if (user.infoUsagePeriod !== period) {
      user.infoUsagePeriod = period;
      user.infoUsage = 0;
    }
    const plan = user.subscriptionPlan || "free";
    if (plan === "free" && Number(user.infoUsage || 0) >= 5) {
      return res
        .status(429)
        .json({
          message:
            "You have used the 5 free information accesses for this month. Please subscribe to continue.",
          code: "INFO_USAGE_LIMIT_REACHED",
          used: Number(user.infoUsage || 0),
          limit: 5,
        });
    }
    user.infoUsage = Number(user.infoUsage || 0) + 1;
    await user.save();
    res.json({ used: user.infoUsage, limit: plan === "free" ? 5 : null, plan });
  } catch (e) {
    next(e);
  }
});

router.post("/events", async (req, res, next) => {
  try {
    const duration = Math.max(
      0,
      Math.min(86400, Number(req.body?.durationSeconds) || 0),
    );
    const event = await UsageEvent.create({
      user: req.user.id,
      feature: String(req.body?.feature || "Page").slice(0, 120),
      path: String(req.body?.path || "").slice(0, 300),
      action: String(req.body?.action || "view").slice(0, 80),
      startedAt: req.body?.startedAt
        ? new Date(req.body.startedAt)
        : new Date(),
      endedAt: req.body?.endedAt ? new Date(req.body.endedAt) : new Date(),
      durationSeconds: duration,
      metadata: req.body?.metadata || {},
    });
    res.status(201).json({ event });
  } catch (e) {
    next(e);
  }
});
export default router;
