import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import TrackedApplication from "../models/TrackedApplication.js";
const router = Router();
router.use(requireAuth);
const statuses = ["Draft", "Applied", "Interview", "Offer", "Rejected", "Expired", "Archived"];
const fields = ["company", "jobTitle", "jobDescription", "applicationDate", "deadline", "source", "location", "status", "notes"];
const clean = body => Object.fromEntries(fields.filter(k => body[k] !== undefined).map(k => [k, body[k]]));
router.get("/applications", async (req,res,next) => {
  try {
    const applications = await TrackedApplication.find({ user: req.user.id }).sort({ updatedAt: -1 }).lean();
    res.json({ applications });
  } catch(e) { next(e); }
});
router.post("/applications", async (req,res,next) => {
  try {
    const payload = clean(req.body);
    if (!String(payload.company||"").trim() || !String(payload.jobTitle||"").trim()) return res.status(400).json({message:"Company and job title are required."});
    if (payload.status && !statuses.includes(payload.status)) return res.status(400).json({message:"Invalid application status."});
    const application = await TrackedApplication.create({ ...payload, user: req.user.id });
    res.status(201).json({ application });
  } catch(e) { next(e); }
});
router.patch("/applications/:id", async (req,res,next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:"Invalid application ID."});
    const payload = clean(req.body);
    if (payload.status && !statuses.includes(payload.status)) return res.status(400).json({message:"Invalid application status."});
    const application = await TrackedApplication.findOneAndUpdate({ _id:req.params.id, user:req.user.id }, { $set:payload }, { new:true, runValidators:true });
    if (!application) return res.status(404).json({message:"Application not found."});
    res.json({ application });
  } catch(e) { next(e); }
});
router.delete("/applications/:id", async (req,res,next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:"Invalid application ID."});
    const result = await TrackedApplication.deleteOne({ _id:req.params.id, user:req.user.id });
    if (!result.deletedCount) return res.status(404).json({message:"Application not found."});
    res.json({message:"Application deleted."});
  } catch(e) { next(e); }
});
export default router;
