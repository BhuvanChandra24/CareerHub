# CareerHub — full source project

CareerHub is a job-search and career-development application with a React/Vite frontend and an Express/MongoDB backend.

## Repository structure

- `frontend/` — React + Vite user interface
- `Backend/backend/` — Express API, MongoDB/Mongoose models, AI integration, job providers, and billing endpoints
- `render.yaml` — Render backend service blueprint
- `frontend/vercel.json` — SPA routing fallback for Vercel

## Requirements

- Node.js 20 or newer (Node 22 LTS recommended)
- MongoDB local instance or MongoDB Atlas
- Optional provider credentials for AI, job listings, Stripe, and email integrations

## Run locally

### 1. Configure backend

```bash
cd Backend/backend
cp .env.example .env
npm install
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if preferred. Edit `.env` with your own values. Set a long, random `JWT_SECRET`, a working `MONGODB_URI`, and the API keys for integrations you actually use.

### 2. Configure frontend

In a separate terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite environment files belong in the `frontend/` project root, not `frontend/src/`. `VITE_API_URL` is public configuration and must never contain secret keys.

### 3. Verify

- Frontend production build: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- Backend startup: `cd Backend/backend && npm start`
- API health check: `GET http://localhost:5000/api/health`

## Deploy

### Backend on Render

The root `render.yaml` configures `Backend/backend` as the service root. Configure `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGINS` in Render's environment settings. Add provider credentials only for features you have enabled. After deploying the frontend, set `CLIENT_ORIGINS` to its exact HTTPS origin. Configure the Stripe webhook to target `/api/billing/webhook` if Stripe billing is enabled.

### Frontend on Vercel

Import the repository, set the project Root Directory to `frontend`, framework preset to Vite, build command to `npm run build`, and output directory to `dist`. Set `VITE_API_URL` to the deployed Render API base URL (for example `https://your-api.onrender.com`) in Vercel environment settings, then redeploy.

## Security before pushing to GitHub

- Do not commit `.env` files, API keys, database credentials, generated uploads, or `node_modules`.
- Use `.env.example` files as templates only. They contain placeholders, not real credentials.
- If a real key was ever included in a shared ZIP or repository, rotate/revoke it. Deleting the file in a later commit does not remove it from Git history.
- Configure production secrets in Render/Vercel settings, not in source code.

## Requirements status

This archive is the complete source tree from the supplied project, cleaned for source control and given deployment templates. It is **not a claim that every requirement in the referenced CareerHub specification is implemented**. Review `REQUIREMENTS_GAP_REPORT.md` before presenting it as fully compliant. Features that require external credentials must also be tested in the configured environment.
