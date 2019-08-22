BEGIN;
ALTER TABLE bookmark_folders ADD CONSTRAINT unique_user_folder UNIQUE (user_id,name);
COMMIT;