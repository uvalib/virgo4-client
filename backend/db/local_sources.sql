UPDATE sources set private_url='https://pool-solr-ws-catalog-dev.internal.lib.virginia.edu' where name = 'books';
UPDATE sources set private_url='https://pool-solr-ws-video-dev.internal.lib.virginia.edu' where name = 'video';
UPDATE sources set private_url='https://pool-solr-ws-archival-dev.internal.lib.virginia.edu' where name = 'archival';
UPDATE sources set private_url='https://pool-solr-ws-serials-dev.internal.lib.virginia.edu' where name = 'serials';
UPDATE sources set private_url='https://pool-solr-ws-sound-recordings-dev.internal.lib.virginia.edu' where name = 'sound-recordings';
UPDATE sources set private_url='https://pool-solr-ws-musical-scores-dev.internal.lib.virginia.edu' where name = 'musical-scores';
UPDATE sources set private_url='https://pool-solr-ws-music-recordings-dev.internal.lib.virginia.edu' where name = 'music-recordings';
UPDATE sources set private_url='https://pool-eds-ws-dev.internal.lib.virginia.edu' where name = 'articles';
UPDATE sources set private_url='https://pool-solr-ws-rarebooks-dev.internal.lib.virginia.edu' where name = 'rarebooks';

UPDATE sources set private_url='http://localhost:8461' where name = 'books';
