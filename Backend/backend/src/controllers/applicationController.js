import fs from "node:fs/promises";
import Application from "../models/Application.js";
import { asyncHandler } from "../utils.js";

export const createApplication = asyncHandler(async (req, res) => {
  if (!req.user?.id)
    return res.status(401).json({ message: "Please sign in before applying." });
  if (!req.file)
    return res.status(400).json({ message: "Please attach your resume." });
  const {
    jobId,
    company,
    jobTitle,
    fullName,
    email,
    phone,
    experience,
    linkedin,
    portfolio,
    coverLetter,
  } = req.body;
  if (!jobId || !company || !jobTitle || !fullName || !email) {
    await fs.unlink(req.file.path).catch(() => {});
    return res
      .status(400)
      .json({ message: "Job, company, name, and email are required." });
  }
  const existing = await Application.findOne({
    user: req.user.id,
    jobId: String(jobId),
  });
  if (existing) {
    await fs.unlink(req.file.path).catch(() => {});
    return res
      .status(409)
      .json({
        message: "You have already applied for this job.",
        application: { id: existing._id, status: existing.status },
      });
  }
  const application = await Application.create({
    user: req.user.id,
    jobId,
    company,
    jobTitle,
    fullName,
    email,
    phone,
    experience,
    linkedin,
    portfolio,
    coverLetter,
    resumePath: req.file.path,
    resumeOriginalName: req.file.originalname,
    status: "submitted",
    statusHistory: [
      {
        status: "submitted",
        date: new Date(),
        note: "Application submitted through CareerHub.",
      },
    ],
  });
  res
    .status(201)
    .json({
      message: "Application submitted successfully.",
      application: { id: application._id, status: application.status },
    });
});

export const listMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ applications });
});

export const getMyApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).lean();
  if (!application)
    return res.status(404).json({ message: "Application not found." });
  res.json({ application });
});

export const updateMyApplication = asyncHandler(async (req, res) => {
  const allowed = [
    "submitted",
    "reviewing",
    "interview",
    "offer",
    "rejected",
    "closed",
  ];
  const status = String(req.body?.status || "").toLowerCase();
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid application status." });
  const application = await Application.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!application)
    return res.status(404).json({ message: "Application not found." });
  if (application.status !== status)
    application.statusHistory.push({
      status,
      date: new Date(),
      note: String(req.body?.note || "Status updated by user.").slice(0, 500),
    });
  application.status = status;
  await application.save();
  res.json({ application });
});
