import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import WorkspaceItem from "../models/WorkspaceItem.js";
const router = Router();
router.use(requireAuth);
const allowed = new Set([
  "activities",
  "contacts",
  "companies",
  "roadmap",
  "learning",
]);
const allowedFields = [
  "title",
  "description",
  "data",
  "status",
  "completed",
  "date",
  "durationMinutes",
  "progress",
];
function sectionParam(req, res, next) {
  if (!allowed.has(req.params.section))
    return res.status(404).json({ message: "Workspace section not found." });
  next();
}
function payload(body) {
  const out = {};
  for (const k of allowedFields) if (body[k] !== undefined) out[k] = body[k];
  if (body.data === undefined) {
    const known = new Set([
      "title",
      "description",
      "status",
      "completed",
      "date",
      "durationMinutes",
      "progress",
    ]);
    const extra = Object.fromEntries(
      Object.entries(body).filter(([k]) => !known.has(k)),
    );
    if (Object.keys(extra).length) out.data = extra;
  }
  return out;
}
router.get("/:section", sectionParam, async (req, res, next) => {
  try {
    const items = await WorkspaceItem.find({
      user: req.user.id,
      section: req.params.section,
    })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
router.post("/:section", sectionParam, async (req, res, next) => {
  try {
    const data = payload(req.body);
    if (!String(data.title || "").trim())
      return res.status(400).json({ message: "Title is required." });
    const item = await WorkspaceItem.create({
      ...data,
      user: req.user.id,
      section: req.params.section,
    });
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});
router.patch("/:section/:id", sectionParam, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid item ID." });
    const item = await WorkspaceItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, section: req.params.section },
      { $set: payload(req.body) },
      { new: true, runValidators: true },
    );
    if (!item) return res.status(404).json({ message: "Item not found." });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});
router.delete("/:section/:id", sectionParam, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid item ID." });
    const r = await WorkspaceItem.deleteOne({
      _id: req.params.id,
      user: req.user.id,
      section: req.params.section,
    });
    if (!r.deletedCount)
      return res.status(404).json({ message: "Item not found." });
    res.json({ message: "Item deleted." });
  } catch (e) {
    next(e);
  }
});
export default router;
