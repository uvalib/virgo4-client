BEGIN;
ALTER TABLE sources DROP COLUMN enabled;
COMMIT;