UPDATE sources set private_url='http://pool-solr-ws-catalog.private.production:8080' where name = 'catalog';
UPDATE sources set private_url='http://pool-solr-ws-video.private.production:8080' where name = 'video';
UPDATE sources set private_url='http://pool-solr-ws-archival.private.production:8080' where name = 'archival';
UPDATE sources set private_url='http://pool-solr-ws-serials.private.production:8080' where name = 'serials';
UPDATE sources set private_url='http://pool-solr-ws-sound-recordings.private.production:8080' where name = 'sound-recordings';
UPDATE sources set private_url='http://pool-solr-ws-musical-scores.private.production:8080' where name = 'musical-scores';
UPDATE sources set private_url='http://pool-solr-ws-music-recordings.private.production:8080' where name = 'music-recordings';
UPDATE sources set private_url='http://pool-eds-ws.private.production:8080' where name = 'articles';