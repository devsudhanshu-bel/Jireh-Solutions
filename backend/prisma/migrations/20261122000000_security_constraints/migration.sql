-- Defence in depth: the API already validates every field (backend/src/schemas.ts).
-- These constraints make the same limits true at the storage layer, so a future
-- code path, a manual psql insert, or a restored dump cannot store data the API
-- would reject. NOT VALID skips pre-existing rows but is enforced for all new writes.

ALTER TABLE "enquiries"
  ADD CONSTRAINT "enquiries_name_length" CHECK (char_length("name") BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT "enquiries_contact_length" CHECK (char_length("contact") BETWEEN 7 AND 20) NOT VALID,
  ADD CONSTRAINT "enquiries_email_length" CHECK (char_length("email") BETWEEN 3 AND 254) NOT VALID,
  ADD CONSTRAINT "enquiries_profession_length" CHECK (char_length("profession") BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT "enquiries_description_length" CHECK (char_length("description") BETWEEN 1 AND 4000) NOT VALID;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_name_length" CHECK (char_length("name") BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT "bookings_contact_length" CHECK (char_length("contact") BETWEEN 7 AND 20) NOT VALID,
  ADD CONSTRAINT "bookings_email_length" CHECK (char_length("email") BETWEEN 3 AND 254) NOT VALID,
  ADD CONSTRAINT "bookings_address_length" CHECK (char_length("address") <= 500) NOT VALID,
  ADD CONSTRAINT "bookings_service_enum" CHECK ("service" IN ('NPWT', 'Advanced Dressing', 'Both')) NOT VALID;

-- Admin triage reads newest first; keep that cheap without exposing an API for it.
CREATE INDEX IF NOT EXISTS "enquiries_createdAt_idx" ON "enquiries" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "bookings_createdAt_idx" ON "bookings" ("createdAt" DESC);
