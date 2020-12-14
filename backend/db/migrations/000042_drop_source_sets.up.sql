BEGIN;

DROP TABLE IF EXISTS source_sets;
delete from sources where sequence=0;

COMMIT;