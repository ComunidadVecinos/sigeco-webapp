-- El estado efectivo de suspension pasa a depender solo de suspended_until.
-- Reconciliamos datos heredados antes de eliminar la columna is_suspended.

UPDATE "memberships"
SET
  "suspended_at" = NULL,
  "suspended_until" = NULL,
  "suspension_reason" = NULL
WHERE "is_suspended" = false;

UPDATE "memberships"
SET "suspended_until" = COALESCE("suspended_until", TIMESTAMP '9999-12-31 23:59:59')
WHERE "is_suspended" = true;

ALTER TABLE "memberships"
DROP COLUMN "is_suspended";
