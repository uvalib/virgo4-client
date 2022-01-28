BEGIN;

CREATE TABLE IF NOT EXISTS pickup_libraries (
   id serial PRIMARY KEY,
   key VARCHAR(20) NOT NULL,
   name VARCHAR(80) NOT NULL,
   enabled  boolean  NOT NULL default true
);

INSERT into pickup_libraries (key, name) values
   ('SCI-ENG', 'Brown Science and Engineering Library (Clark Hall)'),
   ('CLEMONS', 'Clemons Library'),
   ('DARDEN', 'Darden Library'),
   ('MUSIC', 'Music Library'),
   ('FINE-ARTS', 'Fine Arts Library'),
   ('HEALTHSCI', 'Health Sciences Library'),
   ('LAW', 'Law Library'),
   ('LEO', 'LEO delivery to my department');

COMMIT;