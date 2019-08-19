TRUNCATE TABLE sources;
INSERT INTO sources(private_url) values 
   ('http://pool-solr-ws-catalog.private.production:8080'),
   ('http://pool-solr-ws-video.private.production:8080'),
   ('http://pool-solr-ws-archival.private.production:8080'),
   ('http://pool-solr-ws-serials.private.production:8080'),
   ('http://pool-solr-ws-sound-recordings.private.production:8080'),
   ('http://pool-solr-ws-musical-scores.private.production:8080'),
   ('http://pool-solr-ws-music-recordings.private.production:8080');