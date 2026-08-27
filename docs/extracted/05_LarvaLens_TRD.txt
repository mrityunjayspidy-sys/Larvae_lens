--- PAGE 1 ---
LarvaLens
Technical Requirements
Document - TRD
Locked stack, model-loading rules, environment variables, frontend/backend
constraints, security controls, performance budget and technical completion
criteria.
Prepared for
Mohit S. and the LarvaLens team
Build format
Vibe-coding source-of-truth document 02
Version
1.0 - 26 August 2026


--- PAGE 2 ---
LARVALENS - TECHNICAL REQUIREMENTS DOCUMENT
Page 2
Prototype guidance - validate on held-out field video
Vibe Document 02 - Technical
Requirements Document
Document ID: 02_TRD.md Status: Source of truth
7.1 Technology decisions
 Concern
Locked choice
Web
React, Vite, TypeScript, React Router
UI
Tailwind CSS, accessible primitives, Lucide icons
Client data
TanStack Query; Supabase JS only for auth, authorized DB reads and Realtime
PWA
Web app manifest + service worker; cache shell assets, never cache private
videos/results publicly
API
Python 3.11+, FastAPI, Pydantic v2, Uvicorn
ML/CV
Ultralytics, PyTorch, OpenCV, NumPy
Database
Supabase PostgreSQL
Auth
Supabase Auth email/password; JWT forwarded to FastAPI
Storage
Private scan-videos and scan-evidence buckets
Realtime
Supabase Postgres Changes on the signed-in user's scan row
Map
Leaflet + OpenStreetMap tiles with attribution
Frontend deployment
Vercel
Inference deployment
Long-running local/LAN or Python service; no assumption of GPU on Vercel
Tests
Pytest + FastAPI TestClient; Vitest + React Testing Library; Playwright if time permits
7.2 Model-loading rules
 - Backend reads MODEL_DIR/model_manifest.json during application lifespan.
 - It validates the two required files and SHA-256 values before setting models_ready=true.
 - Models load once per process, not per request.
 - A model reload is an explicit administrator/local operation; no arbitrary file path comes from a
 request.
- A scan stores model hashes copied from the loaded manifest.
 - Missing, corrupt or mismatched artifacts produce MODEL_NOT_READY; never fall back to a remote AI
 API.
7.3 Environment variables
 text
# Web - public values only
VITE_API_BASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# API - secrets stay server-side
APP_ENV=development
APP_ORIGIN=http://localhost:5173
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MODEL_DIR=/absolute/path/to/models/active
MAX_VIDEO_MB=80
MAX_VIDEO_SECONDS=15


--- PAGE 3 ---
LARVALENS - TECHNICAL REQUIREMENTS DOCUMENT
Page 3
Prototype guidance - validate on held-out field video
ALLOWED_VIDEO_MIME_TYPES=video/mp4,video/webm,video/quicktime
ENABLE_SPECIES_MODEL=false
LOG_LEVEL=INFO
Never prefix SUPABASE_SERVICE_ROLE_KEY with VITE_. Never commit .env, Kaggle tokens, private
videos or .pt weights.
7.4 API engineering constraints
 - Version routes under /api/v1.
 - Use Pydantic response models; no untyped arbitrary dictionaries at the route boundary.
 - Validate MIME type, extension, file signature, size and decodable duration.
 - Generate storage paths server-side from authenticated user/scan UUIDs.
 - Use idempotency key support for upload retries.
 - Return structured errors: code, message, retryable, request_id.
 - Heavy inference runs outside the request handler. Return HTTP 202 after the real scan row and
 upload succeed.
- Use bounded concurrency so two large videos do not exhaust memory.
 - Delete temporary local copies in finally after storage/evidence persistence.
 - Log IDs and timings, not tokens or private video contents.
 
7.5 Frontend engineering constraints
 - Route guards wait for auth hydration.
 - Every async page has loading, empty, error and success states.
 - Upload UI shows real client-side validation before sending.
 - Progress UI subscribes to the user's authorized scan row and also refetches on reconnect.
 - Do not display an analysis card until the corresponding real row exists.
 - Map handles denied geolocation and scans without coordinates.
 - Keyboard navigation, visible focus, labels, contrast and reduced-motion support are required.
 
7.6 Security requirements
 - RLS enabled on every public table.
 - Authorization roles live in profiles.role or trusted app metadata, not editable user metadata.
 - Service role used only in API process.
 - Private buckets; signed URLs expire quickly and are issued only after row authorization.
 - Public hotspot endpoint returns rounded/aggregated coordinates and counts, not raw scans.
 - Raw model evidence is immutable to ordinary users; reviewer decisions are separate records.
 
7.7 Performance budget
 Area
MVP budget
Web initial load
Keep core route lean; lazy-load map/reviewer pages.
Upload
Up to configured 80 MB and 15 seconds; reject before inference if exceeded.
Model load
Once during API startup. Health exposes readiness, not file paths.
Processing
Sample frames as configured; maintain bounded in-memory crops.
Realtime
One filtered subscription for the active scan; unsubscribe on route exit.


--- PAGE 4 ---
LARVALENS - TECHNICAL REQUIREMENTS DOCUMENT
Page 4
Prototype guidance - validate on held-out field video
7.8 Definition of technical completion
The system is technically complete only when an authenticated user uploads a real video, the API stores
it privately, the supplied model hashes pass, inference runs, the database receives real track evidence,
the PWA updates from real status changes, and the final screen/map use those rows.
