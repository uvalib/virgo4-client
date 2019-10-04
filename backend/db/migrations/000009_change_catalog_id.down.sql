BEGIN;
UPDATE sources set name='catalog' where name='books';
COMMIT;