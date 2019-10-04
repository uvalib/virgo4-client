BEGIN;
UPDATE sources set name='books' where name='catalog';
COMMIT;