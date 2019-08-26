BEGIN;
ALTER TABLE bookmarks DROP source_id;
ALTER TABLE bookmarks DROP added_at;
COMMIT;