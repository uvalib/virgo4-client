BEGIN;
ALTER TABLE bookmark_folders ADD CONSTRAINT bookmark_folders_name_key UNIQUE (name);
COMMIT;