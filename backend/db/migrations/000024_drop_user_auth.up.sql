BEGIN;
ALTER TABLE users DROP COLUMN auth_token;
ALTER TABLE users DROP COLUMN auth_updated_at;
ALTER TABLE users DROP COLUMN signed_in;
COMMIT;