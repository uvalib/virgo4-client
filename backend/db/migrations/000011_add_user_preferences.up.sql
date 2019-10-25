BEGIN;
ALTER TABLE users ADD COLUMN preferences json;
COMMIT;