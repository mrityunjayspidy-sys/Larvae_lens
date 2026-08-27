--- PAGE 1 ---
LarvaLens
Product Requirements
Document - PRD
The product north star: problem, users, value proposition, MVP features,
exclusions, user stories, success metrics and safe product language.
Prepared for
Mohit S. and the LarvaLens team
Build format
Vibe-coding source-of-truth document 01
Version
1.0 - 26 August 2026


--- PAGE 2 ---
LARVALENS - PRODUCT REQUIREMENTS DOCUMENT
Page 2
Prototype guidance - validate on held-out field video
Vibe Document 01 - Product Requirements
Document
Document ID: 01_PRD.md Status: Source of truth Product: LarvaLens Tagline: Video-based probable
mosquito-larva screening with debris rejection and geotagged evidence.
6.1 Problem
Field workers and communities often inspect stagnant water manually. Static-image classifiers can
confuse reflections, sand, leaves, bubbles and floating particles with larvae, and a single detection
confidence does not explain why an object was accepted. LarvaLens uses short video, candidate
detection, binary larva-vs-non-larva verification and temporal tracking to create reviewable evidence.
LarvaLens is a screening and surveillance prototype. It is not a medical diagnosis, definitive species
identification system or replacement for entomological confirmation.
6.2 Primary users
 Persona
Need
Field surveyor / sanitation
worker
Capture or upload a 5-10 second water video, receive an explainable probable-larva
result and geotag the observation.
Public-health reviewer
Inspect accepted and rejected tracks, confirm or reject a scan and view hotspot
patterns.
Project administrator
Verify model versions and service health without viewing user secrets.
Public viewer
View aggregated hotspot information without reporter identity or raw private video.
6.3 Core value proposition
LarvaLens does not trust a single still-frame prediction. It combines where an object appears, whether
its crop resembles larval morphology rather than debris, and whether it persists/moves across time.
Every result records the model versions and track-level acceptance/rejection reason.
6.4 Must-have features for the MVP
 - Email/password authentication through Supabase.
 - Responsive camera/upload flow for short video.
 - Optional browser geolocation with explicit permission and manual skip.
 - Server-side file validation, private storage upload and real scan row.
 - Required model-readiness gate before accepting analysis.
 - Detector + binary verifier + temporal tracking integration.
 - Real status/progress updates from the database.
 - Result with probable-larva count, rejected-track count, confidence, quality and risk band.
 - Track evidence showing accepted/rejected state and reason.
 - Scan history for the signed-in user.
 - Geotagged hotspot map using aggregated scan results.
 - Reviewer queue and human decision for authorized users.
 - No production mock data, hard-coded predictions or external vision AI.
 

--- PAGE 3 ---
LARVALENS - PRODUCT REQUIREMENTS DOCUMENT
Page 3
Prototype guidance - validate on held-out field video
6.5 Nice-to-have features
 - Offline capture queue in IndexedDB, uploaded when connectivity returns.
 - Annotated output-video generation.
 - Experimental species hint only for high-detail crops.
 - Exportable CSV/PDF field report.
 - Multilingual UI labels.
 - Weather overlay and ward-level analytics after the core flow is stable.
 
6.6 Explicitly out of scope
 - Training models inside the web/backend repository.
 - Autonomous public-health action without human confirmation.
 - Guaranteed mosquito species identification from ordinary phone video.
 - Live camera inference entirely inside the browser.
 - Native Flutter/Kotlin application during the initial eight-hour build.
 - Clinical/epidemiological claims or a fixed claimed accuracy before field testing.
 - Public exposure of raw videos, precise home coordinates or user identity.
 
6.7 User stories
 - As a field surveyor, I want to upload a short water video so I can receive a traceable probable-larva
 result.
- As a field surveyor, I want to see actual processing stages so I know the system has not frozen.
 - As a field surveyor, I want a clear retake reason when the video is too dark, blurry or unstable.
 - As a reviewer, I want accepted and rejected track evidence so I can audit false positives.
 - As a reviewer, I want to override the final review decision without erasing the original model
 evidence.
- As an administrator, I want the active model hashes and readiness so I can detect a wrong
 checkpoint.
- As a public viewer, I want aggregated hotspot information without seeing personal data.
 
6.8 Success metrics
 Metric
MVP success criterion
End-to-end completion
A real video produces a real stored result without manual database editing.
Data integrity
Every completed scan stores detector/verifier hashes and track evidence.
Negative-clip rejection
Report actual TN/(TN+FP) on a held-out field set; no invented target.
Positive-clip detection
Report actual TP/(TP+FN) on a held-out field set.
UX
User can understand capture, processing, result and retake states on a 360px phone
screen.
Failure honesty
Missing models, invalid files, unavailable location and inference errors show explicit
states; none become fake success.
6.9 Product language rules
Use "probable mosquito larvae detected," "screening result," "requires review," and "no probable larvae
detected in this clip." Avoid "disease diagnosed," "water is safe," "100% accurate," or "mosquito species
confirmed."
