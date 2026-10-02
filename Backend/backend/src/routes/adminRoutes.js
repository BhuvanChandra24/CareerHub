import { Router } from "express";
import User from "../models/User.js";
import Application from "../models/Application.js";
import TrackedApplication from "../models/TrackedApplication.js";
import ContentItem from "../models/ContentItem.js";
import LearningProgress from "../models/LearningProgress.js";
import UsageEvent from "../models/UsageEvent.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/overview", async (_req, res, next) => {
  try {
    const [
      users,
      applications,
      trackedApplications,
      content,
      progress,
      usage,
      recentUsers,
      recentApplications,
      recentProgress,
      recentUsage,
    ] = await Promise.all([
      User.countDocuments(),
      Application.countDocuments(),
      TrackedApplication.countDocuments(),
      ContentItem.countDocuments(),
      LearningProgress.countDocuments(),
      UsageEvent.countDocuments(),
      User.find()
        .select(
          "fullName email role subscriptionPlan subscriptionStatus createdAt",
        )
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Application.find()
        .select("company jobTitle status email createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      LearningProgress.find()
        .populate("user", "fullName email")
        .populate("content", "title type")
        .sort({ updatedAt: -1 })
        .limit(30)
        .lean(),
      UsageEvent.find()
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
    ]);
    const [plans, contentByType, applicationStatuses] = await Promise.all([
      User.aggregate([
        { $group: { _id: "$subscriptionPlan", count: { $sum: 1 } } },
      ]),
      ContentItem.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            published: { $sum: { $cond: ["$published", 1, 0] } },
          },
        },
      ]),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      counts: {
        users,
        applications,
        trackedApplications,
        content,
        learningProgress: progress,
        usageEvents: usage,
      },
      plans: plans.reduce((a, x) => ({ ...a, [x._id || "free"]: x.count }), {}),
      contentByType: contentByType.reduce(
        (a, x) => ({
          ...a,
          [x._id || "article"]: { count: x.count, published: x.published },
        }),
        {},
      ),
      applicationStatuses: applicationStatuses.reduce(
        (a, x) => ({ ...a, [x._id || "unknown"]: x.count }),
        {},
      ),
      recentUsers,
      recentApplications,
      recentProgress,
      recentUsage,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
