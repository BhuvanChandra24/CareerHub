
import { config } from "../config.js";
import { inferCategory, extractSkills } from "../utils.js";

function normalizeJob(raw, source) {
  const title =
    raw.title ||
    raw.position ||
    raw.job_title ||
    "Untitled role";

  const company =
    raw.company?.display_name ||
    raw.company ||
    raw.company_name ||
    raw.employer ||
    "Company not specified";

  const location =
    raw.location?.display_name ||
    raw.location ||
    raw.job_location ||
    "Location not specified";

  const description =
    raw.description ||
    raw.snippet ||
    raw.summary ||
    "";

  const applyUrl =
    raw.redirect_url ||
    raw.link ||
    raw.url ||
    raw.apply_url ||
    "";

  const postedAt =
    raw.created ||
    raw.updated ||
    raw.date_posted ||
    raw.posted_at ||
    null;

  return {
    id: String(
      raw.id ||
      raw.job_id ||
      `${source}-${title}-${company}-${applyUrl}`
    ),
    title,
    role: title,
    company,
    location,
    employment_type:
      raw.contract_type ||
      raw.type ||
      raw.employment_type ||
      "Not specified",
    type:
      raw.contract_type ||
      raw.type ||
      raw.employment_type ||
      "Not specified",
    experience_level: raw.experience_level || "",
    category: inferCategory(title),
    description,
    skills: extractSkills(`${title} ${description}`),
    source,
    posted_at: postedAt,
    postedAt,
    apply_url: applyUrl,
    applyUrl,
    url: applyUrl,
  };
}

async function fetchAdzuna(query, location) {
  if (!config.adzunaAppId || !config.adzunaAppKey) {
    return [];
  }

  const country = config.adzunaCountry || "in";

  const params = new URLSearchParams({
    app_id: config.adzunaAppId,
    app_key: config.adzunaAppKey,
    results_per_page: "50",
    what: query,
    where: location,
    "content-type": "application/json",
  });

  const url =
    `https://api.adzuna.com/v1/api/jobs/` +
    `${encodeURIComponent(country)}/search/1?${params}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const error = new Error(
      `Adzuna returned HTTP ${response.status}`
    );
    error.provider = "Adzuna";
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  return (data.results || []).map((job) =>
    normalizeJob(job, "Adzuna")
  );
}

async function fetchJooble(query, location) {
  if (!config.joobleApiKey) {
    return [];
  }

  const response = await fetch(
    `https://jooble.org/api/${encodeURIComponent(
      config.joobleApiKey
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        keywords: query,
        location,
        page: "1",
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    const error = new Error(
      `Jooble returned HTTP ${response.status}`
    );
    error.provider = "Jooble";
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  return (data.jobs || []).map((job) =>
    normalizeJob(job, "Jooble")
  );
}

export async function searchJobs({
  query = "",
  location = "India",
  limit = 50,
} = {}) {
  const providers = [];

  if (config.adzunaAppId && config.adzunaAppKey) {
    providers.push({
      name: "Adzuna",
      fetch: () => fetchAdzuna(query, location),
    });
  }

  if (config.joobleApiKey) {
    providers.push({
      name: "Jooble",
      fetch: () => fetchJooble(query, location),
    });
  }

  if (providers.length === 0) {
    const error = new Error(
      "No job provider is configured. Add valid ADZUNA_APP_ID and ADZUNA_APP_KEY, or JOOBLE_API_KEY, to backend/.env."
    );
    error.status = 503;
    throw error;
  }

  const results = await Promise.allSettled(
    providers.map((provider) => provider.fetch())
  );

  const jobs = [];
  const failures = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      failures.push({
        provider: providers[index].name,
        message: result.reason?.message || "Unknown error",
      });

      // Log provider errors without exposing API credentials.
      console.error(
        `${providers[index].name} job search failed:`,
        result.reason?.message || "Unknown error"
      );
    }
  });

  // If every configured provider failed, report a gateway error.
  if (failures.length === providers.length) {
    const error = new Error(
      "All configured job providers failed. Check your API credentials, provider access, and network connection."
    );
    error.status = 502;
    error.providers = failures;
    throw error;
  }

  // Remove duplicate application URLs.
  const seen = new Set();

  const uniqueJobs = jobs.filter((job) => {
    if (!job.title || !job.applyUrl) {
      return false;
    }

    const key = job.applyUrl.trim().toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  const safeLimit = Math.min(
    Math.max(Number(limit) || 50, 1),
    100
  );

  return uniqueJobs.slice(0, safeLimit);
}