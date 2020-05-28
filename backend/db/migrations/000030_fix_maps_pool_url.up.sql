BEGIN;
UPDATE sources set private_url='http://pool-solr-ws-maps-staging.private.staging:8080' where name='maps';
COMMIT;
