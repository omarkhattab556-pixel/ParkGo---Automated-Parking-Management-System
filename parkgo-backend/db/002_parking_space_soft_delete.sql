-- ============================================================================
-- ParkGo — Parking space soft delete
-- Run this in the Supabase SQL editor (project unvzbszdocfmcfpguvrc).
--
-- Why: `parking.parking_space` and `reservation.parking_space` both carry a
-- foreign key onto `parking_space`. Those tables keep *historical* rows
-- (finished sessions, past reservations), so a space that was ever used can
-- never be hard-deleted — Postgres raises
--   "update or delete on table parking_space violates foreign key constraint
--    parking_parking_space_fkey on table parking"
--
-- Instead of deleting the row we retire it: `is_active = false`. Retired
-- spaces disappear from the map, the counts and the allocator, while every
-- historical parking/reservation row keeps pointing at a valid space so the
-- financial reports stay intact.
-- ============================================================================

ALTER TABLE public.parking_space
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Audit trail: when the space was retired and by whom.
ALTER TABLE public.parking_space
  ADD COLUMN IF NOT EXISTS retired_at timestamptz;

ALTER TABLE public.parking_space
  ADD COLUMN IF NOT EXISTS retired_by varchar;

-- Every read path filters on is_active, so index it.
CREATE INDEX IF NOT EXISTS parking_space_is_active_idx
  ON public.parking_space (is_active);

-- Floor grouping / removal filters by location alongside is_active.
CREATE INDEX IF NOT EXISTS parking_space_location_active_idx
  ON public.parking_space (location, is_active);
