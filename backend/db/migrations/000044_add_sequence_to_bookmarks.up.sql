BEGIN;
ALTER TABLE bookmarks ADD COLUMN sequence int  NOT NULL default 0;
COMMIT;