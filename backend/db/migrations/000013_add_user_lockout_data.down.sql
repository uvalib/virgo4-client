BEGIN;
ALTER TABLE users DROP COLUMN locked_out;
ALTER TABLE users DROP COLUMN locked_out_until;
ALTER TABLE users DROP COLUMN auth_started_at;
ALTER TABLE users DROP COLUMN auth_tries;
COMMIT;