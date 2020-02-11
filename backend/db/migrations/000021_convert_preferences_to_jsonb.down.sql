ALTER TABLE users
  ALTER COLUMN preferences
  SET DATA TYPE json
  USING preferences::jsonb;