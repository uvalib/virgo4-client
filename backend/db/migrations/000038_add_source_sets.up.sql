BEGIN;

CREATE TABLE IF NOT EXISTS source_sets (
   id serial PRIMARY KEY,
   name VARCHAR(80) NOT NULL,
   source_id integer NOT NULL REFERENCES sources(id) ON DELETE CASCADE
);

INSERT into source_sets (name, source_id)
   SELECT 'default' as name, id from sources order by id asc;

COMMIT;