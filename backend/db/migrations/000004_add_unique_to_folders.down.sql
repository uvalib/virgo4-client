BEGIN;
ALTER TABLE bookmark_folders DROP CONSTRAINT unique_user_folder;
COMMIT;