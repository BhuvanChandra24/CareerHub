export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Validates a required text value.
 * @param {*} value - Value to validate.
 * @param {string} fieldName - Field name for error messages.
 * @param {number} maxLength - Maximum allowed length.
 * @returns {string} Trimmed text.
 */
export function requireText(value, fieldName = "Text", maxLength = 5000) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(`${fieldName} is required.`);
    error.status = 400;
    throw error;
  }

  const text = value.trim();

  if (text.length > maxLength) {
    const error = new Error(
      `${fieldName} must not exceed ${maxLength} characters.`,
    );
    error.status = 400;
    throw error;
  }

  return text;
}

export function extractSkills(text = "") {
  const vocabulary = [
    "JavaScript",
    "TypeScript",
    "React",
    "React Native",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "PostgreSQL",
    "Python",
    "Java",
    "C++",
    "C#",
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "Git",
    "REST API",
    "GraphQL",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "TensorFlow",
    "PyTorch",
    "Pandas",
    "NumPy",
    "Excel",
    "Power BI",
    "Tableau",
    "Agile",
    "Scrum",
    "Figma",
    "Linux",
    "Redis",
    "Firebase",
  ];

  const normalized = String(text).toLowerCase();

  return vocabulary.filter((skill) => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(
      normalized,
    );
  });
}

export function inferCategory(title = "") {
  const value = String(title).toLowerCase();

  if (/data|analytics|business intelligence/.test(value)) {
    return "Data & Analytics";
  }

  if (/design|ux|ui/.test(value)) {
    return "Design";
  }

  if (/product manager|product owner/.test(value)) {
    return "Product";
  }

  if (/marketing|seo|content/.test(value)) {
    return "Marketing";
  }

  if (/sales|account executive/.test(value)) {
    return "Sales";
  }

  if (/qa|test engineer|automation test/.test(value)) {
    return "Quality Assurance";
  }

  if (/devops|cloud|site reliability/.test(value)) {
    return "Cloud & DevOps";
  }

  if (
    /software|developer|engineer|frontend|backend|full stack|web/.test(value)
  ) {
    return "Software Engineering";
  }

  return "Other";
}
