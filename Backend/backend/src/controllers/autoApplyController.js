import { asyncHandler, extractSkills } from "../utils.js";
import { extractResumeText } from "../services/resumeService.js";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function containsPhrase(text, phrase) {
  const normalizedText = normalize(text);
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedPhrase)}([^a-z0-9]|$)`, "i").test(normalizedText);
}

function requiredExperience(text = "") {
  const value = String(text || "");
  const patterns = [
    /(?:minimum|min\.?|at least)\s*(\d+)\s*(?:\+\s*)?(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+)?experience/i,
    /(\d+)\s*\+\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
    /experience\s*[:\-]?\s*(\d+)\s*\+?\s*(?:years?|yrs?)/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

export const matchDisplayedJobs = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Please sign in to use Auto Apply." });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a PDF or DOCX resume." });
  }

  const interestedRole = String(req.body?.interestedRole || "").trim().slice(0, 120);
  const experienceYears = Number(req.body?.experienceYears);
  const minimumMatch = Number(req.body?.minimumMatch ?? 70);
  let jobs;
  try {
    jobs = JSON.parse(req.body?.jobs || "[]");
  } catch {
    return res.status(400).json({ message: "Displayed jobs payload is invalid." });
  }

  if (!interestedRole) return res.status(400).json({ message: "Interested job role is required." });
  if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 60) {
    return res.status(400).json({ message: "Enter a valid number of years of experience." });
  }
  if (!Number.isFinite(minimumMatch) || minimumMatch < 50 || minimumMatch > 95) {
    return res.status(400).json({ message: "Minimum match must be between 50 and 95." });
  }
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({ message: "No displayed jobs were provided." });
  }
  if (jobs.length > 100) {
    return res.status(400).json({ message: "Check up to 100 displayed jobs per batch." });
  }

  const resumeText = await extractResumeText(req.file);
  if (!resumeText.trim()) {
    return res.status(422).json({ message: "No readable text was found in this resume. Try a text-based PDF or DOCX." });
  }

  const resumeSkills = extractSkills(resumeText);
  const roleTerms = normalize(interestedRole).split(" ").filter((term) => term.length > 2);
  const results = jobs.map((job, index) => {
    const title = String(job?.title || "Untitled role").slice(0, 250);
    const company = String(job?.company || "Company not specified").slice(0, 250);
    const description = String(job?.description || "").slice(0, 20000);
    const skills = Array.isArray(job?.skills)
      ? job.skills.map((skill) => String(skill).slice(0, 100)).slice(0, 100)
      : [];
    const experienceText = String(job?.experience || "");
    const jobText = `${title} ${description} ${skills.join(" ")}`;
    const requiredSkills = [...new Set([...skills, ...extractSkills(`${title} ${description}`)])];
    const matchedSkills = requiredSkills.filter((skill) => containsPhrase(resumeText, skill));
    const missingSkills = requiredSkills.filter((skill) => !containsPhrase(resumeText, skill));
    const keywordTerms = [...new Set(normalize(`${title} ${description} ${skills.join(" ")}`).split(" ").filter((word) => word.length > 3))].slice(0, 80);
    const matchedTerms = keywordTerms.filter((term) => containsPhrase(resumeText, term));
    const keywordScore = keywordTerms.length ? Math.round((matchedTerms.length / keywordTerms.length) * 100) : 0;
    const skillScore = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : keywordScore;
    const matchScore = Math.round(keywordScore * 0.45 + skillScore * 0.55);
    const roleMatch = roleTerms.some((term) => containsPhrase(`${title} ${jobText}`, term));
    const minimumRequiredYears = requiredExperience(`${experienceText} ${description}`);
    const experienceMatch = minimumRequiredYears === null || experienceYears >= minimumRequiredYears;
    const reasons = [];
    if (!roleMatch) reasons.push(`The listing does not clearly match your interested role (“${interestedRole}”).`);
    if (!experienceMatch) reasons.push(`The listing appears to require ${minimumRequiredYears}+ years; your profile says ${experienceYears}.`);
    if (matchScore < minimumMatch) reasons.push(`Resume relevance is below your ${minimumMatch}% threshold.`);
    if (!description.trim() && skills.length === 0) reasons.push("The listing has limited job requirements, so its resume score may be unreliable.");

    let decision = "eligible";
    if (!roleMatch || !experienceMatch) decision = "skipped";
    else if (matchScore < minimumMatch || (!description.trim() && skills.length === 0)) decision = "resume_mismatch";

    return {
      jobId: String(job?.id || job?.applyUrl || `${company}-${title}-${index}`).slice(0, 500),
      title,
      company,
      location: String(job?.location || "").slice(0, 250),
      source: String(job?.source || "").slice(0, 150),
      applyUrl: /^https?:\/\//i.test(String(job?.applyUrl || "")) ? String(job.applyUrl).slice(0, 2000) : "",
      matchScore,
      decision,
      matchedSkills,
      missingSkills,
      reasons: reasons.length ? reasons : ["Role, stated experience, and configured resume relevance checks passed."],
      minimumRequiredYears,
    };
  });

  const summary = {
    checked: results.length,
    eligible: results.filter((item) => item.decision === "eligible").length,
    resumeMismatch: results.filter((item) => item.decision === "resume_mismatch").length,
    skipped: results.filter((item) => item.decision === "skipped").length,
  };

  res.json({
    summary,
    results: results.sort((a, b) => b.matchScore - a.matchScore),
    note: "Matching only: this endpoint does not submit applications to external employers.",
    resumeSkills,
  });
});
