BEGIN;
CREATE TABLE IF NOT EXISTS  search_history (
   id serial PRIMARY KEY,
   user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
   url text NOT NULL
);
COMMIT;