BEGIN;
UPDATE sources set name='serials' where name='journals';
COMMIT;