BEGIN;
ALTER TABLE bookmarks RENAME COLUMN identifier TO catalog_key;
COMMIT;