import { Router } from "express";
import mongoose from "mongoose";
import ContentItem from "../models/ContentItem.js";
import LearningProgress from "../models/LearningProgress.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { infoUsageLimit } from "../middleware/infoUsageLimit.js";

const router = Router();
const rank = { free: 0, fresher: 1, experience: 2, pro: 3 };
const canAccess = (plan, required) =>
  rank[plan || "free"] >= rank[required || "free"];

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("subscriptionPlan");
    const plan = user?.subscriptionPlan || "free";
    const items = await ContentItem.find({ published: true })
      .sort({ createdAt: -1 })
      .lean();
    const progress = await LearningProgress.find({ user: req.user.id }).lean();
    const byContent = new Map(progress.map((x) => [String(x.content), x]));
    res.json({
      items: items.map((item) => {
        const allowed = canAccess(plan, item.plan);
        const p = byContent.get(String(item._id));
        return {
          ...item,
          locked: !allowed,
          body: allowed ? item.body : "",
          url: allowed ? item.url || "" : "",
          progress: p || { percent: 0, completed: false },
        };
      }),
      plan,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/admin", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.json({
      items: await ContentItem.find().sort({ updatedAt: -1 }).lean(),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/admin", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();
    const slug = String(
      req.body?.slug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
    ).trim();
    if (!title || !slug)
      return res.status(400).json({ message: "Title and slug are required." });
    const item = await ContentItem.create({
      title,
      slug,
      type: req.body?.type || "video",
      body: String(req.body?.body || ""),
      summary: String(req.body?.summary || ""),
      url: String(req.body?.url || ""),
      published: Boolean(req.body?.published),
      plan: req.body?.plan || "fresher",
      createdBy: req.user.id,
    });
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});

router.patch("/admin/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid content ID." });
    const allowed = [
      "title",
      "slug",
      "type",
      "body",
      "summary",
      "url",
      "published",
      "plan",
    ];
    const update = Object.fromEntries(
      allowed
        .filter((k) => req.body?.[k] !== undefined)
        .map((k) => [k, req.body[k]]),
    );
    const item = await ContentItem.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!item) return res.status(404).json({ message: "Content not found." });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

router.delete("/admin/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const item = await ContentItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Content not found." });
    await LearningProgress.deleteMany({ content: item._id });
    res.json({ message: "Content deleted." });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, infoUsageLimit, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid content ID." });
    const [item, user] = await Promise.all([
      ContentItem.findOne({ _id: req.params.id, published: true }).lean(),
      User.findById(req.user.id).select("subscriptionPlan"),
    ]);
    if (!item)
      return res.status(404).json({ message: "Learning content not found." });
    const plan = user?.subscriptionPlan || "free";
    if (!canAccess(plan, item.plan))
      return res.status(402).json({
        message: "This career learning resource requires a subscription.",
        code: "SUBSCRIPTION_REQUIRED",
        requiredPlan: item.plan,
      });
    const progress = await LearningProgress.findOneAndUpdate(
      { user: req.user.id, content: item._id },
      { $set: { lastOpenedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.json({ item, progress });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/progress", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid content ID." });
    const [item, user] = await Promise.all([
      ContentItem.findOne({ _id: req.params.id, published: true }).lean(),
      User.findById(req.user.id).select("subscriptionPlan"),
    ]);
    if (!item)
      return res.status(404).json({ message: "Learning content not found." });
    const plan = user?.subscriptionPlan || "free";
    if (!canAccess(plan, item.plan))
      return res.status(402).json({
        message: "Subscribe to access this learning resource.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    const percent = Math.max(0, Math.min(100, Number(req.body?.percent) || 0));
    const completed = Boolean(req.body?.completed) || percent >= 90;
    const progress = await LearningProgress.findOneAndUpdate(
      { user: req.user.id, content: item._id },
      {
        $set: {
          percent,
          positionSeconds: Math.max(0, Number(req.body?.positionSeconds) || 0),
          completed,
          lastOpenedAt: new Date(),
          completedAt: completed ? new Date() : null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json({ progress });
  } catch (e) {
    next(e);
  }
});

export default router;
