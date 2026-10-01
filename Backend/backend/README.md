# CareerHub Backend

Express + MongoDB backend matching the uploaded CareerHub frontend API calls.

## Included endpoints

- `POST /api/auth/signup` — create account; body `{ fullName, email, password }`
- `POST /api/auth/signin` — authenticate; body `{ email, password }`
- `GET /api/auth/me` — current account (Bearer token)
- `GET /api/jobs` — real jobs from configured Adzuna and/or Jooble provider. Optional `q`, `location`, `limit` query parameters.
- `POST /api/resume/analyze` — multipart field `resume`; returns ATS estimate, strengths, improvements, sections and formatting feedback.
- `POST /api/resume/match-jobs` — multipart `resume`, optional `keyword`, `location`; searches providers and scores results against recognized resume skills.
- `POST /api/applications` — multipart resume and application form fields matching Jobs.jsx. Guest submissions are accepted; if token exists, user is attached.

## Setup

1. Install Node.js 18+ and run MongoDB locally or create a MongoDB Atlas database.
2. In this `backend` directory:
   ```bash
   npm install
   cp .env.example .env
   ```
   On Windows PowerShell use `Copy-Item .env.example .env`.
3. Edit `.env`: set `MONGODB_URI`, a long random `JWT_SECRET`, `CLIENT_ORIGIN=http://localhost:5173`, and at least one provider credential.
4. Job provider credentials:
   - Adzuna: create developer credentials and set `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`.
   - Jooble: create API access and set `JOOBLE_API_KEY`.
   The API never invents sample jobs. Without a provider configured, `/api/jobs` returns HTTP 503 with a clear setup message.
5. Start:
   ```bash
   npm run dev
   ```
6. Verify `http://localhost:5000/api/health`.

## Frontend

Place the updated frontend files in the matching `src/Pages` folder. Move the API environment setting to the Vite project root (same folder as frontend `package.json`), not `src/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Restart Vite after changing `.env`.

## Important notes

- The resume score is a transparent rule-based estimate, not a third-party ATS certification or an LLM assessment.
- PDF and DOCX text extraction are supported. Legacy `.doc` files can be uploaded but text extraction may return a clear unsupported-format error; save these as PDF or DOCX.
- Application resume files are stored in `uploads/`. Configure private persistent storage and retention rules before production deployment; do not serve this directory publicly.
- LinkedIn and Naukri are not scraped. Use provider-approved APIs/licensing or an authorized aggregator that grants access to those listings. Current implementation uses Adzuna/Jooble if configured.
- Before production, use HTTPS, set strong secrets, configure the deployed frontend origin, review privacy/retention obligations for uploaded resumes, and configure provider quotas.
