--- PAGE 1 ---
LarvaLens
App Flow
Navigation and User Journeys
Every route, navigation rule, entry point, core journey, empty/error state,
reconnect behavior and redirect rule for the LarvaLens PWA.
Prepared for
Mohit S. and the LarvaLens team
Build format
Vibe-coding source-of-truth document 03
Version
1.0 - 26 August 2026


--- PAGE 2 ---
LARVALENS - APP FLOW
Page 2
Prototype guidance - validate on held-out field video
Vibe Document 03 - App Flow and
Navigation Map
Document ID: 03_APP_FLOW.md Status: Source of truth
8.1 Routes
 Route
Access
Purpose
/
Public
Product explanation, limitations and sign-in
CTA.
/login
Public only
Email/password sign-in and account
creation.
/scan
Authenticated
Record/select video, validate, request
location and submit.
/scans/:scanId/proce
ssing
Owner/reviewer
Actual stage and progress from Realtime.
/scans/:scanId
Owner/reviewer
Summary, evidence tracks, quality, model
version and review state.
/history
Authenticated
Paginated own scans.
/map
Public aggregated or authenticated
Hotspot map with privacy-preserving
markers.
/review
Reviewer/admin
Review queue.
/review/:scanId
Reviewer/admin
Evidence and human decision form.
/admin/models
Admin
Read-only model readiness, hashes and
stage metadata.
/settings
Authenticated
Profile and privacy information.
*
Any
Helpful not-found page.
8.2 Navigation
Desktop uses a top bar with Scan, History and Map; reviewer/admin items appear only when authorized.
Mobile uses a bottom navigation with Scan, History and Map. Account/settings lives in the top-right
menu. The primary scan CTA remains reachable with one tap.
8.3 First-time journey
 text
Landing
  -> Create account / Sign in
  -> Email/password authentication
  -> /scan
  -> permission explainer
  -> select/record short video
  -> optional location consent
  -> client validation
  -> POST real scan
  -> /scans/{id}/processing
  -> completed / failed / retake-required
  -> /scans/{id}
8.4 Core journey 1 - successful scan
 1. User selects a real 5-10 second video.
 2. Web validates extension, size and available metadata.
 

--- PAGE 3 ---
LARVALENS - APP FLOW
Page 3
Prototype guidance - validate on held-out field video
3. User optionally grants location; denial does not block analysis.
 4. API validates JWT, model readiness and media.
 5. API creates scans row and private storage object; returns 202.
 6. Web navigates using returned UUID and subscribes to that row.
 7. Processing states update from actual backend writes.
 8. On completed, web refetches result and track evidence.
 9. User sees probable count, rejected count, confidence, quality, risk, limitations and map location if
 provided.
8.5 Core journey 2 - model unavailable
 text
Submit
  -> API checks manifest/files
  -> missing/hash mismatch
  -> HTTP 503 MODEL_NOT_READY
  -> keep selected video locally in the page
  -> show "Analysis service is not ready"
  -> offer Retry and System Status
No scan is presented as successful. No placeholder result appears.
8.6 Core journey 3 - reviewer decision
 1. Reviewer opens /review and sees authorized real scans needing review.
 2. Reviewer opens evidence, including accepted/rejected tracks and model versions.
 3. Reviewer selects confirm, reject or inconclusive and adds notes.
 4. API writes a separate reviews record and updates review_status transactionally.
 5. Raw counts and track probabilities remain unchanged.
 
8.7 Empty, error and reconnect states
 Condition
UI behavior
No history
Explain how to create the first scan; no fake cards.
No map points
Show an empty map message and privacy note.
File too large/long
Explain configured limit before upload.
Unsupported/corrupt video
Ask for MP4/WebM/MOV retake or conversion.
Location denied
Continue without coordinates.
Low light/blur/camera shake
Show retake_required with backend reason.
Network interruption before
upload
Preserve selection in page and allow retry.
Realtime disconnect
Show reconnecting state and poll/refetch current scan.
Inference failure
Show request ID and retryability; never show partial count as final.
Unauthorized route
Redirect to login or a dedicated forbidden page, preserving intended route.
8.8 Redirect rules
 - Logged-in user visiting /login -> /scan.
 - Logged-out user visiting protected route -> /login?next=<encoded-route>.
 - Successful submission -> /scans/{scanId}/processing.
 - Processing completed -> replace route with /scans/{scanId}.
 

--- PAGE 4 ---
LARVALENS - APP FLOW
Page 4
Prototype guidance - validate on held-out field video
- Logout -> / and clear query cache/subscriptions.
 - Reviewer without reviewer/admin role -> /forbidden.
 