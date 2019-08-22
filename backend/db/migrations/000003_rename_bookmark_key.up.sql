BEGIN;
ALTER TABLE bookmarks RENAME COLUMN catalog_key TO identifier;
COMMIT;