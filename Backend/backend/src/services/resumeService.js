import fs from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function extractResumeText(file) {
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
  if (ext === ".doc") {
    throw new Error(
      "Legacy .doc files are not supported for text extraction. Save the resume as PDF or DOCX and upload again.",
    );
  }
  throw new Error("Unsupported resume format. Upload PDF or DOCX.");
}

const sectionPatterns = {
  experience: /experience|employment|work history/i,
  education: /education|academic|qualification/i,
  skills: /skills|technical skills|competencies/i,
  projects: /projects|portfolio/i,
};

export async function analyzeResume(file) {
  const text = await extractResumeText(file);
  if (!text.trim()) {
    const error = new Error(
      "No readable text was found. Please upload a text-based PDF or DOCX.",
    );
    error.status = 422;
    throw error;
  }
  const skills = (await import("../utils.js")).extractSkills(text);
  const sections = Object.entries(sectionPatterns).map(([name, pattern]) => ({
    name: name[0].toUpperCase() + name.slice(1),
    present: pattern.test(text),
    message: pattern.test(text)
      ? `${name[0].toUpperCase() + name.slice(1)} section detected.`
      : `Consider adding a clear ${name} section.`,
  }));
  const wordCount = text.trim().split(/\s+/).length;
  const emailFound = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const phoneFound = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const sectionScore = Math.round(
    (sections.filter((item) => item.present).length / sections.length) * 35,
  );
  const contactScore = (emailFound ? 5 : 0) + (phoneFound ? 5 : 0);
  const contentScore = Math.min(25, Math.round(wordCount / 24));
  const skillScore = Math.min(25, skills.length * 2);
  const score = Math.min(
    100,
    sectionScore + contactScore + contentScore + skillScore,
  );
  const missing = sections
    .filter((item) => !item.present)
    .map((item) => item.message);
  const improvements = [...missing];
  if (!emailFound)
    improvements.push(
      "Add a professional email address in your contact section.",
    );
  if (!phoneFound) improvements.push("Add a phone number with country code.");
  if (wordCount < 180)
    improvements.push(
      "Add more relevant detail about projects, responsibilities, and measurable outcomes.",
    );
  if (skills.length < 5)
    improvements.push(
      "Include role-relevant technical and transferable skills where accurate.",
    );
  return {
    score,
    atsScore: score,
    summary: `Your resume contains approximately ${wordCount} words and ${skills.length} recognized skills. This is a rule-based screening estimate, not a guarantee of ATS performance.`,
    strengths: [
      ...(emailFound ? ["Contact email detected."] : []),
      ...(phoneFound ? ["Phone number detected."] : []),
      ...(skills.length ? [`Recognized skills: ${skills.join(", ")}.`] : []),
    ],
    improvements,
    recommendations: improvements,
    missingKeywords: [],
    keywordsMissing: [],
    sections,
    formattingIssues: [
      "Automated text extraction cannot reliably assess visual layout, columns, or font consistency. Review the PDF visually before applying.",
    ],
    formattingFeedback: [
      "Use clear section headings, consistent dates, and a simple single-column layout where possible.",
    ],
  };
}
