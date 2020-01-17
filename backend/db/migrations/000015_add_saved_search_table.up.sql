BEGIN;
CREATE TABLE IF NOT EXISTS  saved_searches (
   id serial PRIMARY KEY,
   token VARCHAR(20) UNIQUE NOT NULL,
   user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   name VARCHAR(255) default '',
   is_public boolean NOT NULL DEFAULT false,
   created_at timestamptz NOT NULL,
   search jsonb NOT NULL default '{}'::jsonb
);
COMMIT;