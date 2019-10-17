BEGIN;
ALTER TABLE bookmark_folders DROP CONSTRAINT bookmark_folders_name_key;
COMMIT;