BEGIN;

DELETE from source_sets where name='alt';
DELETE from sources where name='uva_library' or name='hathitrust';

COMMIT;