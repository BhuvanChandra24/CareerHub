import fs from "node:fs/promises";
import Application from "../models/Application.js";
import { asyncHandler } from "../utils.js";

export const createApplication = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Please attach your resume.",
    });
  }

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

    return res.status(400).json({
      message: "Job, company, name, and email are required.",
    });
  }

  const application = await Application.create({
    user: req.user?.id || null,
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
  });

  res.status(201).json({
    message: "Application submitted successfully.",
    application: {
      id: application._id,
      status: application.status,
    },
  });
});