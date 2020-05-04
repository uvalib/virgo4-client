BEGIN;
ALTER TABLE saved_searches DROP COLUMN search_url;
COMMIT;