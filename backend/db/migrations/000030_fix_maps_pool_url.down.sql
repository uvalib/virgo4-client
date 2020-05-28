BEGIN;
UPDATE sources set private_url='http://pool-solr-ws-maps.private.staging:8080' where name='maps';
COMMIT;
