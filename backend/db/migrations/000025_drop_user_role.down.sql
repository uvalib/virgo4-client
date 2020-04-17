BEGIN;
CREATE TYPE v4_role AS ENUM ('user', 'admin');
ALTER TABLE users ADD COLUMN role v4_role NOT NULL DEFAULT 'user';
COMMIT;