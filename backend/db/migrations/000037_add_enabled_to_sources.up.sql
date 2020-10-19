BEGIN;
ALTER TABLE sources ADD COLUMN enabled boolean  NOT NULL default true;
COMMIT;