# CareerHub requirements gap report

This report is a conservative source-level checklist against `Manoj PPS(5).pdf`. Existing route/page presence does not prove end-to-end behavior; validate each item with a running database and configured external services.

| PDF area | Source-level status | Next verification / work |
|---|---|---|
| Job application tracker | Partial/substantial | Exercise all status transitions, editing, deletion, deadlines, notes, filters, and per-user isolation. |
| AI resume review | Partial | Test PDF/DOC/DOCX parsing, ATS analysis, formatting findings, and failures with real provider. Vision parsing is not established. |
| AI job matching | Partial | Add/verify semantic compatibility, qualifications, gaps, and tailored recommendations beyond keyword matching. |
| Cover letter generator | Endpoint present | Test using selected resume + job description, result saving/copying, provider failure, and usage accounting. |
| Branding toolbox | Partial | Verify all six tools and persist usage history and limits. |
| Mock interviews | Partial | Verify dynamic/follow-up questions, resume/job context, feedback, interview history, and all scenarios. |
| Resume management | Partial | Add/verify multiple resume records, structured builder, metadata, version history, and comparison. |
| Career dashboard | Partial | Verify all chart/statistic data comes from the authenticated user's persisted records. |
| Activity tracking | Partial | Verify custom types, duration/time tracking, edit/delete, calendar, and aggregation. |
| Contacts CRM | Partial | Verify contact fields, CRUD, and linked networking activities. |
| Company/location database | Partial | Verify reusable company/location records and links to applications. |
| Career roadmap | Partial | Verify milestone/step hierarchy and persisted progress. |
| Content/learning library | Partial | Add/verify admin publishing, blog/webinar/video content, gated access, and plan authorization. |
| Video progress | Incomplete/not established | Persist playback position and percentage, continue-watching, completion at 80%, and cross-session progress. |
| Admin/content management | Incomplete/not established | Implement secure admin role and user, plan, AI config, content, branding, video, subscription, and settings management. |
| Plan quotas | Incomplete/not established | Enforce Free/Freshers/Experience limits server-side, including monthly AI usage and storage; test bypass attempts. |
| Stripe lifecycle | Partial | Test signed/idempotent webhooks, checkout, renewals, cancellation, status changes, and reconciliation in test mode. |
| Authentication | Partial | Verify password hashing, JWT/session expiry, logout, protected APIs. Google OAuth, email verification, and password reset are not established in the source inspected. |

## Stack difference

The PDF describes Next.js 14, TypeScript, Prisma, MongoDB, OpenAI, and Auth.js. This codebase uses React/Vite, Express, Mongoose, Groq, and JWT. This is a stack deviation, even where similar functionality can be implemented.

## Deployment gate

Do not describe the project as fully compliant until the incomplete items above have been implemented and tested. Do not treat missing provider credentials as a passed integration test.
