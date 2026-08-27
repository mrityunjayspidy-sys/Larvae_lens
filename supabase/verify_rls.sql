-- ==============================================================================
-- LarvaLens Phase 2: RLS and Security Verification Script
-- Source of Truth: 05_BACKEND_SCHEMA.md
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Test Case 1: Signup Trigger & Role Isolation
-- Verify that new users always receive the 'field_worker' role by default
-- and cannot self-assign 'reviewer' or 'admin' via raw_user_meta_data.
-- ------------------------------------------------------------------------------
-- 1. Create User A (Field Worker)
-- INSERT INTO auth.users (id, email, raw_user_meta_data)
-- VALUES ('11111111-1111-1111-1111-111111111111', 'worker_a@example.com', '{"full_name": "Worker A", "role": "admin"}');
-- Expected: Trigger inserts into public.profiles with role = 'field_worker' (ignoring user_metadata 'admin').
SELECT id, full_name, role FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';

-- ------------------------------------------------------------------------------
-- Test Case 2: Cross-User Isolation (User A cannot read User B scan)
-- ------------------------------------------------------------------------------
-- As authenticated User A:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
-- Attempt to select User B's scan:
SELECT * FROM public.scans WHERE owner_id = '22222222-2222-2222-2222-222222222222';
-- Expected result: 0 rows returned (blocked by scans_read_own_or_reviewer policy).

-- ------------------------------------------------------------------------------
-- Test Case 3: Field Worker Cannot Insert Reviews
-- ------------------------------------------------------------------------------
-- As authenticated User A (Field Worker):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
-- Attempt to insert a review:
-- INSERT INTO public.reviews (scan_id, reviewer_id, decision, notes)
-- VALUES ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'confirmed', 'Self audit');
-- Expected result: Permission denied (blocked by reviews_insert_reviewer policy requiring has_review_role()).

-- ------------------------------------------------------------------------------
-- Test Case 4: Reviewer Can Read Review Queue & Evidence
-- ------------------------------------------------------------------------------
-- As authenticated Reviewer User (Promoted via trusted server SQL):
-- UPDATE public.profiles SET role = 'reviewer' WHERE id = '44444444-4444-4444-4444-444444444444';
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
SELECT s.id, s.status, s.probable_larvae_count, count(t.id) as track_count
FROM public.scans s
LEFT JOIN public.tracks t ON t.scan_id = s.id
GROUP BY s.id;
-- Expected result: Returns all scans and track evidence across all owners.
