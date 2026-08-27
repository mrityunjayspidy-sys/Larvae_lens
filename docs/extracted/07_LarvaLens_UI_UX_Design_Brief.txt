--- PAGE 1 ---
LarvaLens
UI/UX Design Brief
Visual and Interaction Guide
Public-health visual direction, color and typography tokens, component
patterns, mobile layout, accessibility, result hierarchy and prohibited UI
patterns.
Prepared for
Mohit S. and the LarvaLens team
Build format
Vibe-coding source-of-truth document 04
Version
1.0 - 26 August 2026


--- PAGE 2 ---
LARVALENS - UI UX DESIGN BRIEF
Page 2
Prototype guidance - validate on held-out field video
Vibe Document 04 - UI/UX Design Brief
Document ID: 04_UI_UX.md Status: Source of truth
9.1 Design direction
Clean public-health field tool: calm, credible, evidence-first and usable outdoors. Avoid glossy AI
gradients, holograms, robots, fake radar effects or decorative dashboards. The interface should make
capture, processing status and evidence clearer than branding.
9.2 Visual tokens
 Token
Value
Use
Navy
#102A43
Headings, navigation, high-contrast text.
Blue
#1363DF
Primary CTA, links, active controls.
Teal
#0F8B8D
Surveillance/evidence accent and map
context.
Green
#208A61
Completed/confirmed state; not "water
safe."
Amber
#E59F23
Needs review, medium risk, warnings.
Red
#C94A4A
High risk and blocking errors only.
Background
#F5F8FC
App canvas.
Surface
#FFFFFF
Cards and panels.
Text
#243B53
Body text.
Use Inter or a system sans-serif. Headings are 28/22/18px; body is 16px on mobile and never below
14px for essential information. Use 12px card radius, 8px control radius and subtle borders instead of
heavy shadows.
9.3 Key components
 - VideoCaptureCard: file/camera input, duration/size status and replacement action.
 - LocationConsent: explains why coordinates are requested and supports Skip.
 - ModelReadinessBanner: visible only when unavailable/degraded.
 - ProcessingTimeline: real stages with current state; no fake percentages.
 - ResultHero: probable count, confidence, risk and review status.
 - EvidenceFunnel: candidates -> morphology accepted -> temporally supported -> probable larvae.
 - TrackEvidenceCard: accepted/rejected badge, detector, larva, non-larva, motion and reason.
 - QualityCard: lighting, blur/stability and retake recommendation.
 - HotspotMap: clustered/aggregated markers with legend and attribution.
 - ReviewDecisionPanel: confirm/reject/inconclusive and notes.
 
9.4 Mobile layout
 - Single column at 360-767px.
 - Sticky primary action above the bottom navigation when appropriate.
 - Large 44px minimum touch targets.
 - Evidence metrics stack vertically; do not compress into unreadable tables.
 - Video preview uses 16:9 with contained media.
 

--- PAGE 3 ---
LARVALENS - UI UX DESIGN BRIEF
Page 3
Prototype guidance - validate on held-out field video
- Bottom navigation never covers form buttons or browser safe areas.
 
9.5 Accessibility
 - Meet WCAG AA contrast for text and controls.
 - Never encode risk or state by color alone; include text and icon.
 - All form controls have visible labels and error association.
 - Keyboard focus is visible and logical.
 - Dialogs trap focus and close with Escape.
 - Respect prefers-reduced-motion.
 - Provide text alternatives for charts and evidence visualizations.
 - Use plain language: "No probable larvae detected in this clip" rather than "negative specimen."
 
9.6 Result screen hierarchy
 1. Status and limitations.
 2. Probable count, rejected count and confidence.
 3. Quality/retake state.
 4. Evidence funnel.
 5. Track details.
 6. Location/map.
 7. Model version and audit details in a collapsed technical section.
 
9.7 Forbidden UI patterns
 - Fake live counters, demo charts or seeded hotspots.
 - A giant confidence number without what contributed to it.
 - "Safe water" or "disease-free" badges.
 - Hiding model-unavailable errors behind an infinite spinner.
 - Showing precise home coordinates on a public map.
 - Exposing private storage object paths or signed URLs in page text.
 