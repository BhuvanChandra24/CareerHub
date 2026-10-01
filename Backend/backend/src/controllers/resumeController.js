import { asyncHandler } from "../utils.js";
import { analyzeResume } from "../services/resumeService.js";
import { searchJobs } from "../services/jobProviders.js";
import { extractResumeText } from "../services/resumeService.js";
import { extractSkills } from "../utils.js";

export const analyze = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please upload a PDF or DOCX resume." });
  const result = await analyzeResume(req.file);
  res.json(result);
});

export const matchJobs = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please upload a PDF or DOCX resume." });
  const text = await extractResumeText(req.file);
  if (!text.trim()) return res.status(422).json({ message: "No readable text found in resume." });
  const extractedSkills = extractSkills(text);
  const keyword = String(req.body.keyword || "").trim();
  const location = String(req.body.location || "India").trim();
  const jobs = await searchJobs({ query: [keyword, ...extractedSkills.slice(0, 5)].filter(Boolean).join(" "), location, limit: 50 });
  const matched = jobs.map((job) => {
    const haystack = `${job.title} ${job.description} ${(job.skills || []).join(" ")}`.toLowerCase();
    const matchedSkills = extractedSkills.filter((skill) => haystack.includes(skill.toLowerCase()));
    const matchScore = extractedSkills.length ? Math.round(matchedSkills.length / extractedSkills.length * 100) : 0;
    return { ...job, matchScore, matchPercentage: matchScore, matchedSkills };
  }).sort((a, b) => b.matchScore - a.matchScore);
  res.json({ jobs: matched, extractedSkills, skills: extractedSkills });
});
