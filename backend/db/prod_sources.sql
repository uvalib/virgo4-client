TRUNCATE TABLE sources restart identity;
INSERT INTO sources(name,private_url) values 
   ('catalog', 'http://pool-solr-ws-catalog.private.production:8080'),
   ('video', 'http://pool-solr-ws-video.private.production:8080'),
   ('archival', 'http://pool-solr-ws-archival.private.production:8080'),
   ('serials', 'http://pool-solr-ws-serials.private.production:8080'),
   ('sound-recordings', 'http://pool-solr-ws-sound-recordings.private.production:8080'),
   ('musical-scores', 'http://pool-solr-ws-musical-scores.private.production:8080'),
   ('music-recordings', 'http://pool-solr-ws-music-recordings.private.production:8080');