UPDATE sources set private_url='http://pool-solr-ws-catalog.private.staging:8080' where name = 'catalog';
UPDATE sources set private_url='http://pool-solr-ws-video.private.staging:8080' where name = 'video';
UPDATE sources set private_url='http://pool-solr-ws-archival.private.staging:8080' where name = 'archival';
UPDATE sources set private_url='http://pool-solr-ws-serials.private.staging:8080' where name = 'serials';
UPDATE sources set private_url='http://pool-solr-ws-sound-recordings.private.staging:8080' where name = 'sound-recordings';
UPDATE sources set private_url='http://pool-solr-ws-musical-scores.private.staging:8080' where name = 'musical-scores';
UPDATE sources set private_url='http://pool-solr-ws-music-recordings.private.staging:8080' where name = 'music-recordings';
UPDATE sources set private_url='http://pool-eds-ws.private.staging:8080' where name = 'articles';
UPDATE sources set private_url='http://pool-solr-ws-rarebooks.private.staging:8080' where name = 'rarebooks';


https://pool-solr-ws-rarebooks-dev.internal.lib.virginia.edu