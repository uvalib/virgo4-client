BEGIN;
ALTER TABLE sources ADD COLUMN sequence int  NOT NULL default 0;

update sources set sequence=1 where name='uva_library';
update sources set sequence=2 where name='articles';
update sources set sequence=3 where name='images';
update sources set sequence=4 where name='hathitrust';
update sources set sequence=5 where name='jmrl';
update sources set sequence=6 where name='worldcat';

COMMIT;