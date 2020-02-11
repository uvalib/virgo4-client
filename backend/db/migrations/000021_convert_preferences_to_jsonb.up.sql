BEGIN;

ALTER TABLE users
  ALTER COLUMN preferences
  SET DATA TYPE jsonb
  USING preferences::text::jsonb;

ALTER TABLE users
   ALTER COLUMN preferences
   SET   default '{}'::jsonb;

COMMIT;