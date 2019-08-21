BEGIN;
ALTER TABLE users ADD COLUMN signed_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users RENAME COLUMN auth_created_at TO auth_updated_at;
COMMIT;