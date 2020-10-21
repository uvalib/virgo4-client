BEGIN;
ALTER TABLE source_sets ADD COLUMN sequence int  NOT NULL default 0;

update source_sets set sequence=1 where name='alt' and source_id=(select id from sources where name='uva_library');
update source_sets set sequence=2 where name='alt' and source_id=(select id from sources where name='articles');
update source_sets set sequence=3 where name='alt' and source_id=(select id from sources where name='images');
update source_sets set sequence=4 where name='alt' and source_id=(select id from sources where name='hathitrust');
update source_sets set sequence=5 where name='alt' and source_id=(select id from sources where name='jmrl');
update source_sets set sequence=6 where name='alt' and source_id=(select id from sources where name='worldcat');

COMMIT;