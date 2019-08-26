BEGIN;
TRUNCATE TABLE sources restart identity;
ALTER TABLE sources ADD COLUMN name varchar(50) NOT NULL UNIQUE;
INSERT INTO sources(name, private_url) values 
   ('catalog', 'http://pool-solr-ws-catalog.private.staging:8080'),
   ('video', 'http://pool-solr-ws-video.private.staging:8080'),
   ('archival', 'http://pool-solr-ws-archival.private.staging:8080'),
   ('serials', 'http://pool-solr-ws-serials.private.staging:8080'),
   ('sound-recordings', 'http://pool-solr-ws-sound-recordings.private.staging:8080'),
   ('musical-scores', 'http://pool-solr-ws-musical-scores.private.staging:8080'),
   ('music-recordings', 'http://pool-solr-ws-music-recordings.private.staging:8080'),
   ('articles', 'http://pool-eds-ws.private.staging:8080');
COMMIT;