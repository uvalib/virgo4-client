BEGIN;
ALTER TABLE bookmark_folders ADD COLUMN token VARCHAR(20) UNIQUE;
ALTER TABLE bookmark_folders ADD COLUMN is_public boolean NOT NULL DEFAULT false;
COMMIT;