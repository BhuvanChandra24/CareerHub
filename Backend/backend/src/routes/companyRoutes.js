import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Company from "../models/Company.js";

const router = Router();
router.use(requireAuth);
const companyFields = ["name", "website", "industry", "location", "notes"];
const openingFields = [
  "title",
  "location",
  "type",
  "status",
  "url",
  "openedAt",
  "notes",
];
const clean = (body, fields) =>
  Object.fromEntries(
    fields
      .filter((key) => body[key] !== undefined)
      .map((key) => [key, body[key]]),
  );

router.get("/", async (req, res, next) => {
  try {
    const companies = await Company.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ companies });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = clean(req.body, companyFields);
    if (!String(payload.name || "").trim())
      return res.status(400).json({ message: "Company name is required." });
    const company = await Company.create({ ...payload, user: req.user.id });
    res.status(201).json({ company });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid company ID." });
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: clean(req.body, companyFields) },
      { new: true, runValidators: true },
    );
    if (!company)
      return res.status(404).json({ message: "Company not found." });
    res.json({ company });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid company ID." });
    const result = await Company.deleteOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!result.deletedCount)
      return res.status(404).json({ message: "Company not found." });
    res.json({ message: "Company deleted." });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/openings", async (req, res, next) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!company)
      return res.status(404).json({ message: "Company not found." });
    const payload = clean(req.body, openingFields);
    if (!String(payload.title || "").trim())
      return res.status(400).json({ message: "Opening title is required." });
    company.openings.push(payload);
    await company.save();
    res.status(201).json({ company });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/openings/:openingId", async (req, res, next) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!company)
      return res.status(404).json({ message: "Company not found." });
    const opening = company.openings.id(req.params.openingId);
    if (!opening)
      return res.status(404).json({ message: "Opening not found." });
    opening.deleteOne();
    await company.save();
    res.json({ company });
  } catch (error) {
    next(error);
  }
});

export default router;
