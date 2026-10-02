import fs from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function extractResumeText(file) {
  if (!file)
    throw Object.assign(new Error("Please upload a PDF or DOCX resume."), {
      status: 400,
    });
  const ext = path
    .extname(file.originalname || file.filename || "")
    .toLowerCase();
  const buffer = file.buffer || (await fs.readFile(file.path));
  if (ext === ".pdf" || file.mimetype === "application/pdf") {
    const parsed = await pdf(buffer);
    return parsed.text || "";
  }
  if (
    ext === ".docx" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  if (ext === ".doc")
    throw Object.assign(
      new Error(
        "Legacy .doc files are not supported. Save the resume as PDF or DOCX.",
      ),
      { status: 400 },
    );
  throw Object.assign(
    new Error("Unsupported resume format. Upload PDF or DOCX."),
    { status: 400 },
  );
}

const sectionPatterns = {
  summary:
    /(^|\n)\s*(professional\s+summary|summary|profile|objective)\s*[:\-]?\s*(\n|$)/i,
  experience:
    /(^|\n)\s*(experience|work\s+experience|employment|work\s+history)\s*[:\-]?\s*(\n|$)/i,
  education: /(^|\n)\s*(education|academic|qualifications?)\s*[:\-]?\s*(\n|$)/i,
  skills:
    /(^|\n)\s*(skills|technical\s+skills|core\s+competencies|competencies)\s*[:\-]?\s*(\n|$)/i,
  projects:
    /(^|\n)\s*(projects|personal\s+projects|portfolio)\s*[:\-]?\s*(\n|$)/i,
  certifications: /(^|\n)\s*(certifications?|licenses?)\s*[:\-]?\s*(\n|$)/i,
};

const STOP_WORDS = new Set(
  `the and for with from that this your you are was were will have has had their they our into about after before using used use can may should than then also not but all any each when where which who how what why a an in on at to of by as is it be or if do does did i we he she his her its my me them these those`.split(
    /\s+/,
  ),
);
const TECH_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "react.js",
  "angular",
  "vue",
  "node.js",
  "node",
  "express",
  "mongodb",
  "sql",
  "mysql",
  "postgresql",
  "python",
  "java",
  "spring boot",
  "c++",
  "c#",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "git",
  "github",
  "rest api",
  "graphql",
  "tailwind",
  "html",
  "css",
  "figma",
  "machine learning",
  "deep learning",
  "nlp",
  "tensorflow",
  "pytorch",
  "scikit-learn",
  "power bi",
  "tableau",
  "excel",
  "agile",
  "scrum",
  "jira",
  "figma",
  "next.js",
  "vite",
  "redux",
  "redis",
  "firebase",
  "linux",
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function terms(text) {
  return [
    ...new Set(
      normalize(text)
        .split(" ")
        .filter((x) => x.length > 2 && !STOP_WORDS.has(x)),
    ),
  ];
}
function phraseMatch(haystack, phrase) {
  const h = normalize(haystack);
  const p = normalize(phrase);
  return h.includes(p);
}
function pct(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function keywordEngine(resumeText, jobDescription) {
  if (!jobDescription.trim())
    return {
      score: null,
      label: "Not scored",
      matched: [],
      missing: [],
      note: "Add a target job description to calculate job-specific keyword match.",
    };
  const jdTerms = terms(jobDescription).filter((t) => t.length >= 4);
  const unique = jdTerms.slice(0, 80);
  const matched = unique.filter((t) => phraseMatch(resumeText, t));
  const missing = unique
    .filter((t) => !phraseMatch(resumeText, t))
    .slice(0, 20);
  return {
    score: pct(unique.length ? (matched.length / unique.length) * 100 : 0),
    label: "Job match",
    matched,
    missing,
    note: `${matched.length} of ${unique.length} relevant job-description terms were found in the resume text.`,
  };
}

function skillEngine(text) {
  const found = TECH_SKILLS.filter((skill) => phraseMatch(text, skill));
  const score = pct(Math.min(100, found.length * 5));
  return {
    score,
    label: "Skills evidence",
    matched: found,
    note: `${found.length} recognized technical skills were found. This is a coverage signal, not a qualification judgment.`,
  };
}

function sectionEngine(text) {
  const sections = Object.entries(sectionPatterns).map(([name, pattern]) => ({
    name,
    present: pattern.test(text),
  }));
  const score = pct(
    (sections.filter((x) => x.present).length / sections.length) * 100,
  );
  return {
    score,
    label: "Section structure",
    sections,
    note: "Checks for conventional ATS-readable section headings.",
  };
}

function contactEngine(text) {
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const url = /(https?:\/\/|www\.)\S+/i.test(text);
  const score = (email ? 40 : 0) + (phone ? 35 : 0) + (url ? 25 : 0);
  return {
    score,
    label: "Contact completeness",
    signals: { email, phone, professionalUrl: url },
    note: "Checks whether common contact signals are extractable from the document.",
  };
}

function parseEngine(text, file) {
  const words = terms(text).length;
  const replacementChars = (text.match(/ /g) || []).length;
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const score = pct(
    (words >= 180 ? 45 : (words / 180) * 45) +
      (lines.length >= 12 ? 30 : (lines.length / 12) * 30) +
      (replacementChars === 0 ? 25 : Math.max(0, 25 - replacementChars * 5)),
  );
  return {
    score,
    label: "Parser readability",
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    replacementChars,
    note: "Measures whether the extracted text is substantial and clean enough for downstream parsing.",
  };
}

function formatEngine(text) {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const longLines = lines.filter((x) => x.length > 180).length;
  const repeatedPipes = (text.match(/\|/g) || []).length;
  const repeatedTabs = (text.match(/\t/g) || []).length;
  const score = pct(
    100 -
      Math.min(70, longLines * 8) -
      Math.min(20, repeatedPipes * 2) -
      Math.min(10, repeatedTabs),
  );
  return {
    score,
    label: "ATS formatting safety",
    signals: { longLines, tableLikePipes: repeatedPipes, tabs: repeatedTabs },
    note: "Uses extracted-text heuristics; visual PDF layout still needs human review.",
  };
}

export async function analyzeResume(file, { jobDescription = "" } = {}) {
  const text = await extractResumeText(file);
  if (!text.trim())
    throw Object.assign(
      new Error(
        "No readable text was found. Please upload a text-based PDF or DOCX.",
      ),
      { status: 422 },
    );

  const normalizedJD = String(jobDescription || "")
    .trim()
    .slice(0, 12000);
  const engines = [
    parseEngine(text, file),
    sectionEngine(text),
    contactEngine(text),
    keywordEngine(text, normalizedJD),
    skillEngine(text),
    formatEngine(text),
  ];
  const scored = engines.filter((x) => Number.isFinite(x.score));
  const baseWeights = {
    "Parser readability": 0.2,
    "Section structure": 0.15,
    "Contact completeness": 0.1,
    "Job match": 0.25,
    "Skills evidence": 0.15,
    "ATS formatting safety": 0.15,
  };
  const weightTotal =
    scored.reduce((sum, x) => sum + (baseWeights[x.label] || 0), 0) || 1;
  const score = pct(
    scored.reduce((sum, x) => sum + x.score * (baseWeights[x.label] || 0), 0) /
      weightTotal,
  );

  const sections =
    engines.find((x) => x.label === "Section structure")?.sections || [];
  const keyword = engines.find((x) => x.label === "Job match");
  const skills = engines.find((x) => x.label === "Skills evidence");
  const missing = sections
    .filter((x) => !x.present)
    .map((x) => `Add a clear ${x.name} section.`);
  if (keyword?.score !== null)
    missing.push(
      ...keyword.missing
        .slice(0, 10)
        .map(
          (x) =>
            `Consider including “${x}” if it genuinely describes your experience.`,
        ),
    );
  if ((skills?.matched || []).length < 5)
    missing.push(
      "Add relevant skills you actually possess, using terminology from the target role where accurate.",
    );

  return {
    score,
    atsScore: score,
    scoreType: normalizedJD ? "job-specific" : "resume-readiness",
    summary: normalizedJD
      ? `Ensemble ATS estimate for this resume against the supplied job description: ${score}/100.`
      : `Resume-readiness estimate: ${score}/100. A job-specific ATS match requires a target job description.`,
    disclaimer:
      "There is no universal ATS score. This is a transparent CareerHub estimate based on six analysis engines; employer ATS configurations differ.",
    engines,
    strengths: engines
      .filter((x) => x.score !== null && x.score >= 75)
      .map((x) => `${x.label}: ${x.score}/100.`),
    improvements: missing.slice(0, 15),
    recommendations: missing.slice(0, 15),
    missingKeywords: keyword?.missing || [],
    keywordsMissing: keyword?.missing || [],
    matchedKeywords: keyword?.matched || [],
    sections,
    formattingIssues: [formatEngine(text).note],
    formattingFeedback: [formatEngine(text).note],
    metrics: {
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      recognizedSkills: skills?.matched || [],
      jobDescriptionProvided: Boolean(normalizedJD),
    },
  };
}
