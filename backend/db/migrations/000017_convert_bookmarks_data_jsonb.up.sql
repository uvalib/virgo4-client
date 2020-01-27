BEGIN;

ALTER TABLE bookmarks
  ALTER COLUMN details
  SET DATA TYPE jsonb
  USING details::text::jsonb;

ALTER TABLE bookmarks
   ALTER COLUMN details
   SET   default '{}'::jsonb;

COMMIT;