-- Adds pro_profiles.verification_opt_in — the pro onboarding wizard's step
-- 5 checkbox ("Add me to the Musion Verified review queue") already
-- collects this value client-side, but there was never a column to store
-- it, so the onboarding route silently dropped it. Needed for a real
-- settings/verification opt-in toggle (MVP_ARCHITECTURE.md Section 10)
-- rather than a checkbox that writes nowhere. Run this in the Supabase
-- SQL editor.

alter table public.pro_profiles
  add column if not exists verification_opt_in boolean not null default false;
