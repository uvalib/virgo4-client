ALTER TABLE bookmarks
  ALTER COLUMN details
  SET DATA TYPE json
  USING details::jsonb;