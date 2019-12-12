BEGIN;
UPDATE sources set name='journals' where name='serials';
COMMIT;