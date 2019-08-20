CREATE TABLE IF NOT EXISTS sources (
   id serial PRIMARY KEY,
   private_url VARCHAR (80) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS  users (
   id serial PRIMARY KEY,
   virgo4_id VARCHAR (80) UNIQUE NOT NULL,
   auth_token VARCHAR(80) UNIQUE NOT NULL,
   auth_created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS  bookmark_folders (
   id serial PRIMARY KEY,
   user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS  bookmarks (
   id serial PRIMARY KEY,
   user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   folder_id integer NOT NULL REFERENCES bookmark_folders(id) ON DELETE CASCADE,
   catalog_key VARCHAR(50) NOT NULL,
   details json NOT NULL
);

