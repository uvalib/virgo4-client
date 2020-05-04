BEGIN;
ALTER TABLE saved_searches ADD COLUMN search_url text not null default '';
COMMIT;