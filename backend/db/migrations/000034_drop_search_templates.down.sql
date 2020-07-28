CREATE TABLE IF NOT EXISTS  search_templates (
   id serial PRIMARY KEY,
   user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   name VARCHAR(255) UNIQUE NOT NULL,
   template jsonb NOT NULL default '{}'::jsonb,
   UNIQUE (user_id, name)
);