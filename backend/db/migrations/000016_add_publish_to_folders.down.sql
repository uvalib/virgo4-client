BEGIN;
ALTER TABLE bookmark_folders DROP COLUMN token;
ALTER TABLE bookmark_folders DROP COLUMN is_public;
COMMIT;