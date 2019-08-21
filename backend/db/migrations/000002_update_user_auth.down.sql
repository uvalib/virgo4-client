BEGIN;
ALTER TABLE users DROP COLUMN signed_in;
ALTER TABLE users RENAME COLUMN auth_updated_at TO auth_created_at;
COMMIT;