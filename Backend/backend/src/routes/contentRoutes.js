import { Router } from "express";
import mongoose from "mongoose";
import ContentItem from "../models/ContentItem.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await ContentItem.find({ published: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.use(requireAuth, requireAdmin);
router.get("/admin", async (_req, res, next) => {
  try {
    res.json({
      items: await ContentItem.find().sort({ updatedAt: -1 }).lean(),
    });
  } catch (e) {
    next(e);
  }
});
router.post("/admin", async (req, res, next) => {
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
      type: req.body?.type || "article",
      body: String(req.body?.body || ""),
      summary: String(req.body?.summary || ""),
      published: Boolean(req.body?.published),
      plan: req.body?.plan || "free",
      createdBy: req.user.id,
    });
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});
router.patch("/admin/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid content ID." });
    const allowed = [
      "title",
      "slug",
      "type",
      "body",
      "summary",
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
router.delete("/admin/:id", async (req, res, next) => {
  try {
    const item = await ContentItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Content not found." });
    res.json({ message: "Content deleted." });
  } catch (e) {
    next(e);
  }
});
export default router;
