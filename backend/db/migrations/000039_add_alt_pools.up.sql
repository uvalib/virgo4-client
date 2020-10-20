BEGIN;

INSERT into sources (private_url,name,public_url) VALUES
   ('http://pool-solr-ws-uva-library-staging.private.staging:8080', 'uva_library', 'https://pool-solr-ws-uva-library-dev.internal.lib.virginia.edu'),
   ('http://pool-solr-ws-hathitrust-staging.private.staging:8080', 'hathitrust', 'https://pool-solr-ws-hathitrust-dev.internal.lib.virginia.edu');

INSERT into source_sets (name, source_id)
   SELECT 'alt' as name, id from sources where name='uva_library';
INSERT into source_sets (name, source_id)
   SELECT 'alt' as name, id from sources where name='articles';
INSERT into source_sets (name, source_id)
   SELECT 'alt' as name, id from sources where name='images';
INSERT into source_sets (name, source_id)
   SELECT 'alt' as name, id from sources where name='hathitrust';
INSERT into source_sets (name, source_id)
   SELECT 'alt' as name, id from sources where name='jmrl';
INSERT into source_sets (name, source_id)
   SELECT 'alt' as name, id from sources where name='worldcat';

COMMIT;