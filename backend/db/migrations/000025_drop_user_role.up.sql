BEGIN;
ALTER TABLE users DROP COLUMN role;
DROP TYPE v4_role;
COMMIT;