BEGIN;
ALTER TABLE saved_searches ADD COLUMN search jsonb NOT NULL default '{}'::jsonb;
COMMIT;