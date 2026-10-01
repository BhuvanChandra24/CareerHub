import { searchJobs } from "../services/jobProviders.js";
import { asyncHandler, extractSkills } from "../utils.js";
import { extractResumeText } from "../services/resumeService.js";

export const listJobs = asyncHandler(async (req, res) => {
  const jobs = await searchJobs({
    query: String(req.query.q || req.query.keyword || ""),
    location: String(req.query.location || "India"),
    limit: req.query.limit || 50,
  });
  res.json({
    jobs,
    count: jobs.length,
    sources: [...new Set(jobs.map((job) => job.source))],
  });
});

export const matchResumeJobs = asyncHandler(async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ message: "Please upload a PDF, DOC, or DOCX resume." });
  const text = await extractResumeText(req.file);
  if (!text.trim())
    return res
      .status(422)
      .json({
        message:
          "No readable text was found in this resume. Try a text-based PDF or DOCX.",
      });
  const extractedSkills = extractSkills(text);
  const keyword = String(req.body.keyword || "").trim();
  const location = String(req.body.location || "India").trim();
  const jobs = await searchJobs({
    query: [keyword, ...extractedSkills.slice(0, 5)].filter(Boolean).join(" "),
    location,
    limit: 50,
  });
  const scored = jobs
    .map((job) => {
      const haystack =
        `${job.title} ${job.description} ${(job.skills || []).join(" ")}`.toLowerCase();
      const matchedSkills = extractedSkills.filter((skill) =>
        haystack.includes(skill.toLowerCase()),
      );
      const score = extractedSkills.length
        ? Math.round((matchedSkills.length / extractedSkills.length) * 100)
        : 0;
      return {
        ...job,
        matchScore: score,
        matchPercentage: score,
        matchedSkills,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
  res.json({ jobs: scored, extractedSkills, skills: extractedSkills });
});
