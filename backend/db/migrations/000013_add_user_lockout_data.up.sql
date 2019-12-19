BEGIN;
ALTER TABLE users ADD COLUMN locked_out BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN locked_out_until timestamptz;
ALTER TABLE users ADD COLUMN auth_started_at timestamptz;
ALTER TABLE users ADD COLUMN auth_tries integer NOT NULL DEFAULT 0;
COMMIT;