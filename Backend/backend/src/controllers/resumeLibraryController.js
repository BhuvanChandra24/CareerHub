import mongoose from "mongoose";
import Resume from "../models/Resume.js";
import { analyzeResume, extractResumeText } from "../services/resumeService.js";
import { asyncHandler } from "../utils.js";

function publicResume(item) {
  return {
    _id: item._id,
    name: item.name,
    fileName: item.fileName,
    mimeType: item.mimeType,
    isDefault: item.isDefault,
    analysis: item.analysis,
    versions: (item.versions || []).map((v) => ({
      _id: v._id,
      version: v.version,
      label: v.label,
      fileName: v.fileName,
      createdAt: v.createdAt,
    })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const listResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user.id })
    .sort({ isDefault: -1, updatedAt: -1 })
    .lean();
  res.json({ resumes: resumes.map(publicResume) });
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ message: "Please upload a PDF, DOC, or DOCX resume." });
  const name = String(
    req.body?.name || req.file.originalname.replace(/\.[^.]+$/, ""),
  )
    .trim()
    .slice(0, 160);
  if (!name)
    return res.status(400).json({ message: "Resume name is required." });

  const text = await extractResumeText(req.file);
  const analysis = await analyzeResume(req.file);
  const count = await Resume.countDocuments({ user: req.user.id });
  const resume = await Resume.create({
    user: req.user.id,
    name,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    text: text.slice(0, 50000),
    analysis,
    isDefault: count === 0,
    versions: [
      {
        version: 1,
        label: "Initial upload",
        fileName: req.file.originalname,
        text: text.slice(0, 50000),
        analysis,
      },
    ],
  });
  res.status(201).json({ resume: publicResume(resume) });
});

export const renameResume = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid resume ID." });
  const name = String(req.body?.name || "")
    .trim()
    .slice(0, 160);
  if (!name)
    return res.status(400).json({ message: "Resume name is required." });
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { name } },
    { new: true },
  );
  if (!resume) return res.status(404).json({ message: "Resume not found." });
  res.json({ resume: publicResume(resume) });
});

export const setDefaultResume = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid resume ID." });
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!resume) return res.status(404).json({ message: "Resume not found." });
  await Resume.updateMany(
    { user: req.user.id },
    { $set: { isDefault: false } },
  );
  resume.isDefault = true;
  await resume.save();
  res.json({ resume: publicResume(resume) });
});

export const addResumeVersion = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid resume ID." });
  if (!req.file)
    return res
      .status(400)
      .json({ message: "Please upload the new resume version." });
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!resume) return res.status(404).json({ message: "Resume not found." });
  const text = await extractResumeText(req.file);
  const analysis = await analyzeResume(req.file);
  const nextVersion =
    (resume.versions?.reduce((max, v) => Math.max(max, v.version || 0), 0) ||
      0) + 1;
  resume.versions.push({
    version: nextVersion,
    label: String(req.body?.label || `Version ${nextVersion}`).slice(0, 120),
    fileName: req.file.originalname,
    text: text.slice(0, 50000),
    analysis,
  });
  resume.fileName = req.file.originalname;
  resume.mimeType = req.file.mimetype;
  resume.text = text.slice(0, 50000);
  resume.analysis = analysis;
  await resume.save();
  res.json({ resume: publicResume(resume) });
});

export const compareResumes = asyncHandler(async (req, res) => {
  const ids = [req.query.a, req.query.b];
  if (ids.some((id) => !mongoose.isValidObjectId(id)))
    return res
      .status(400)
      .json({ message: "Two valid resume IDs are required." });
  const resumes = await Resume.find({
    _id: { $in: ids },
    user: req.user.id,
  }).lean();
  if (resumes.length !== 2)
    return res
      .status(404)
      .json({ message: "Both resumes must belong to your account." });
  const [a, b] = ids.map((id) =>
    resumes.find((r) => String(r._id) === String(id)),
  );
  const words = (text) =>
    new Set(
      String(text || "")
        .toLowerCase()
        .match(/[a-z][a-z0-9+#.-]{1,30}/g) || [],
    );
  const aw = words(a.text),
    bw = words(b.text);
  const added = [...bw].filter((x) => !aw.has(x)).slice(0, 100);
  const removed = [...aw].filter((x) => !bw.has(x)).slice(0, 100);
  res.json({
    first: { id: a._id, name: a.name },
    second: { id: b._id, name: b.name },
    addedKeywords: added,
    removedKeywords: removed,
    commonKeywordCount: [...aw].filter((x) => bw.has(x)).length,
  });
});

export const deleteResume = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid resume ID." });
  const resume = await Resume.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!resume) return res.status(404).json({ message: "Resume not found." });
  if (resume.isDefault) {
    const replacement = await Resume.findOne({ user: req.user.id }).sort({
      updatedAt: -1,
    });
    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    }
  }
  res.json({ message: "Resume deleted." });
});
